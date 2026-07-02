import logging
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from .config import settings

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/calendar.events"]
TOKEN_URI = "https://oauth2.googleapis.com/token"


@dataclass
class BookingResult:
    meet_url: str
    start: datetime
    end: datetime
    visitor_email: str
    calendar_link: str


def _calendar_service():
    creds = Credentials(
        token=None,
        refresh_token=settings.google_refresh_token,
        token_uri=TOKEN_URI,
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        scopes=SCOPES,
    )
    creds.refresh(Request())
    return build("calendar", "v3", credentials=creds, cache_discovery=False)


def is_slot_free(start: datetime, duration_minutes: int) -> bool:
    """Check the owner's primary calendar via the FreeBusy API."""
    if settings.demo_mode:
        return True
    end = start + timedelta(minutes=duration_minutes)
    service = _calendar_service()
    response = (
        service.freebusy()
        .query(
            body={
                "timeMin": start.isoformat(),
                "timeMax": end.isoformat(),
                "items": [{"id": "primary"}],
            }
        )
        .execute()
    )
    busy = response["calendars"]["primary"].get("busy", [])
    return len(busy) == 0


def create_meeting(
    visitor_email: str,
    start: datetime,
    duration_minutes: int,
    topic: str | None = None,
) -> BookingResult:
    """Create a calendar event with a Google Meet link.

    The owner is the organizer, so the event lands in his calendar; the
    visitor is an attendee and `sendUpdates="all"` emails the invitation
    (with the Meet link) to both parties.
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
        "attendees": [{"email": visitor_email}],
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
