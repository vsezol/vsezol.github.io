"""One-time helper: obtain a Google OAuth refresh token for the backend.

Prerequisites (see backend/README section in the repo README):
1. In Google Cloud Console create a project, enable the "Google Calendar API".
2. Create OAuth credentials of type "Desktop app", copy client id/secret.
3. Run from the backend directory:

   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... uv run python scripts/get_google_refresh_token.py

A browser window opens — sign in with the OWNER's Google account
(the calendar where meetings should be created). The refresh token is
printed at the end; put it into .env as GOOGLE_REFRESH_TOKEN.
"""

import os
import sys

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    # availability check (FreeBusy API)
    "https://www.googleapis.com/auth/calendar.freebusy",
]


def main() -> None:
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    if not client_id or not client_secret:
        sys.exit("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars first.")

    flow = InstalledAppFlow.from_client_config(
        {
            "installed": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": ["http://localhost"],
            }
        },
        SCOPES,
    )
    creds = flow.run_local_server(
        port=0, access_type="offline", prompt="consent"
    )
    print("\nAdd this to backend/.env:\n")
    print(f"GOOGLE_REFRESH_TOKEN={creds.refresh_token}")


if __name__ == "__main__":
    main()
