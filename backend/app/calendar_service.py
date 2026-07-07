import logging
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from .config import settings

logger = logging.getLogger(__name__)

TOKEN_URI = "https://oauth2.googleapis.com/token"

# Unique marker written into every agent-created event's description, used to
# find (and only ever delete) meetings this agent booked — never hand-made
# calendar events.
AGENT_MARKER = "Meeting booked via the AI agent"


@dataclass
class BookingResult:
    meet_url: str
    start: datetime
    end: datetime
    visitor_email: str
    calendar_link: str


def _calendar_service():
    # scopes intentionally omitted: the refresh grant keeps whatever scopes
    # the user consented to (see scripts/get_google_refresh_token.py)
    creds = Credentials(
        token=None,
        refresh_token=settings.google_refresh_token,
        token_uri=TOKEN_URI,
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
    )
    creds.refresh(Request())
    return build("calendar", "v3", credentials=creds, cache_discovery=False)


def is_slot_free(start: datetime, duration_minutes: int) -> bool:
    """Check availability via the FreeBusy API.

    Queries the authorized account's primary calendar and, when the backend
    runs under a dedicated bot account, the owner's calendar too (visible if
    the owner shared at least free/busy with the bot). Calendars the bot
    can't read are skipped.
    """
    if settings.demo_mode:
        return True
    end = start + timedelta(minutes=duration_minutes)
    ids = ["primary"]
    if settings.owner_email:
        ids.append(settings.owner_email)
    service = _calendar_service()
    try:
        response = (
            service.freebusy()
            .query(
                body={
                    "timeMin": start.isoformat(),
                    "timeMax": end.isoformat(),
                    "items": [{"id": i} for i in ids],
                }
            )
            .execute()
        )
    except HttpError as exc:
        # Availability check must never block a booking (e.g. the refresh
        # token was granted without the freebusy scope).
        logger.warning("FreeBusy check failed, assuming the slot is free: %s", exc)
        return True
    for calendar in response.get("calendars", {}).values():
        if calendar.get("errors"):
            continue  # not shared with the bot — can't see it, skip
        if calendar.get("busy"):
            return False
    return True


def list_agent_events(time_min: datetime, time_max: datetime) -> list[dict]:
    """List events the agent created (by description marker) in a window.

    Returns [{id, summary, start}]. Empty in DEMO_MODE (no real calendar).
    """
    if settings.demo_mode:
        return []
    service = _calendar_service()
    out: list[dict] = []
    page_token = None
    while True:
        resp = (
            service.events()
            .list(
                calendarId="primary",
                timeMin=time_min.isoformat(),
                timeMax=time_max.isoformat(),
                singleEvents=True,
                showDeleted=False,
                maxResults=250,
                pageToken=page_token,
            )
            .execute()
        )
        for ev in resp.get("items", []):
            if AGENT_MARKER in (ev.get("description") or ""):
                out.append(
                    {
                        "id": ev.get("id"),
                        "summary": ev.get("summary", ""),
                        "start": ev.get("start", {}).get("dateTime", ""),
                    }
                )
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    return out


def delete_events(event_ids: list[str]) -> int:
    """Delete events by id (no cancellation emails). Returns the count deleted."""
    if settings.demo_mode or not event_ids:
        return 0
    service = _calendar_service()
    deleted = 0
    for eid in event_ids:
        try:
            service.events().delete(
                calendarId="primary", eventId=eid, sendUpdates="none"
            ).execute()
            deleted += 1
        except HttpError as exc:
            logger.warning("Failed to delete event %s: %s", eid, exc)
    return deleted


def create_meeting(
    visitor_email: str,
    start: datetime,
    duration_minutes: int,
    topic: str | None = None,
) -> BookingResult:
    """Create a calendar event with a Google Meet link.

    The authorized account is the organizer; the visitor and the owner are
    attendees, and `sendUpdates="all"` emails the invitation (with the Meet
    link) to everyone. When the backend runs under a dedicated bot account
    (e.g. because the owner's account is under Advanced Protection), the
    owner still receives the invite and the event in his calendar.
    """
    end = start + timedelta(minutes=duration_minutes)

    if settings.demo_mode:
        logger.warning("DEMO_MODE is on — returning a fake booking, no email sent")
        return BookingResult(
            meet_url="https://meet.google.com/demo-mode-link",
            start=start,
            end=end,
            visitor_email=visitor_email,
            calendar_link="https://calendar.google.com/",
        )

    summary = f"{settings.owner_name} <> {visitor_email}"
    if topic:
        summary = f"{settings.owner_name} <> {visitor_email}: {topic}"

    body = {
        "summary": summary,
        "description": (
            "Meeting booked via the AI agent at https://vsezol.github.io"
            + (f"\n\nTopic: {topic}" if topic else "")
        ),
        "start": {"dateTime": start.isoformat()},
        "end": {"dateTime": end.isoformat()},
        "attendees": [{"email": visitor_email}]
        + ([{"email": settings.owner_email}] if settings.owner_email else []),
        "conferenceData": {
            "createRequest": {
                "requestId": uuid.uuid4().hex,
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        },
    }

    service = _calendar_service()
    created = (
        service.events()
        .insert(
            calendarId="primary",
            body=body,
            conferenceDataVersion=1,
            sendUpdates="all",
        )
        .execute()
    )

    meet_url = created.get("hangoutLink")
    if not meet_url:
        for entry in created.get("conferenceData", {}).get("entryPoints", []):
            if entry.get("entryPointType") == "video":
                meet_url = entry["uri"]
                break
    if not meet_url:
        raise RuntimeError("Google Calendar did not return a Meet link")

    logger.info("Booked meeting %s for %s", created.get("id"), visitor_email)
    return BookingResult(
        meet_url=meet_url,
        start=start,
        end=end,
        visitor_email=visitor_email,
        calendar_link=created.get("htmlLink", ""),
    )
