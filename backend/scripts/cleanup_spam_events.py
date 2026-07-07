"""Delete spam meetings created by the AI agent (incident cleanup).

Only touches events the agent itself created — matched by the unique marker
in their description — so hand-made calendar events are never removed. Dry
run by default; pass --yes to actually delete. Cancellations are NOT emailed
(the attacker used throwaway addresses; no point spamming them).

Usage (from backend/, with the same env as the app — GOOGLE_CLIENT_ID,
GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN):

    uv run python scripts/cleanup_spam_events.py                 # preview
    uv run python scripts/cleanup_spam_events.py --yes           # delete
    uv run python scripts/cleanup_spam_events.py --from 2026-07-07 --to 2026-08-01 --yes
"""

import argparse
import sys
from datetime import datetime, timedelta, timezone

from googleapiclient.errors import HttpError

from app.calendar_service import _calendar_service

# Unique marker written into every agent-created event's description.
AGENT_MARKER = "Meeting booked via the AI agent"


def _parse_date(value: str) -> datetime:
    return datetime.strptime(value, "%Y-%m-%d").replace(tzinfo=timezone.utc)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--from", dest="frm", help="YYYY-MM-DD (default: now)")
    parser.add_argument("--to", dest="to", help="YYYY-MM-DD (default: +90 days)")
    parser.add_argument(
        "--yes", action="store_true", help="actually delete (default: dry run)"
    )
    args = parser.parse_args()

    time_min = _parse_date(args.frm) if args.frm else datetime.now(timezone.utc)
    time_max = _parse_date(args.to) if args.to else time_min + timedelta(days=90)

    service = _calendar_service()
    print(f"Scanning primary calendar {time_min.date()} … {time_max.date()}")

    matched, deleted, page_token = [], 0, None
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
            if AGENT_MARKER not in (ev.get("description") or ""):
                continue
            matched.append(ev)
        page_token = resp.get("nextPageToken")
        if not page_token:
            break

    print(f"Found {len(matched)} agent-created event(s).")
    for ev in matched:
        when = ev.get("start", {}).get("dateTime", "?")
        print(f"  {when}  {ev.get('summary', '(no title)')}  [{ev.get('id')}]")

    if not args.yes:
        print("\nDry run — nothing deleted. Re-run with --yes to remove these.")
        return 0

    print(f"\nDeleting {len(matched)} event(s)…")
    for ev in matched:
        try:
            service.events().delete(
                calendarId="primary", eventId=ev["id"], sendUpdates="none"
            ).execute()
            deleted += 1
        except HttpError as exc:
            print(f"  failed to delete {ev.get('id')}: {exc}")
    print(f"Done. Deleted {deleted}/{len(matched)}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
