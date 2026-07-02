# vsezol.github.io — Personal AI Agent

A chat-first personal site. Visitors talk to the AI agent of **Vsevolod Zolotov**
(Senior AI Engineer) and book a meeting with him right in the chat: the agent
parses free-form requests ("I want to meet Seva tomorrow at 15:00, my email is
dm@gmail.com"), confirms the details with interactive widgets, books a slot in
Google Calendar with a Google Meet link, and emails invitations to both sides.

## Architecture

```
frontend/   React + Vite + Mantine + @chatscope/chat-ui-kit-react
            → GitHub Pages (this repo, gh-pages branch)

backend/    Python + FastAPI + Pydantic AI (Claude via API key)
            + Google Calendar API (Meet link, invites, freebusy check)
            → any Docker host (Fly.io / Railway / Render / VPS)
```

Chat protocol: the frontend POSTs `{message, history, client_timezone}` to
`/api/chat`; the backend runs the agent and answers with one of four typed
replies — `text`, `ask_email` (email widget), `ask_datetime` (calendar + time
picker widget), `booked` (card with the Meet link). `history` is the opaque
serialized agent conversation, stored client-side, so the backend is stateless.

## Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173, proxies /api → localhost:8000
```

- Mobile-first, automatic dark theme (follows the system).
- `VITE_API_URL` — backend base URL for production builds (set as the
  `API_URL` repository variable for the deploy workflow).

## Backend

```bash
cd backend
uv sync
cp .env.example .env   # fill in the values
uv run uvicorn app.main:app --reload
```

Run tests: `uv run pytest`.

### Environment

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude API key (required) |
| `ANTHROPIC_MODEL` | default `claude-opus-4-8`; use `claude-sonnet-4-6` to cut costs |
| `OWNER_NAME` / `OWNER_EMAIL` / `OWNER_TIMEZONE` | whose calendar to book |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REFRESH_TOKEN` | Google Calendar access |
| `DEMO_MODE` | `true` → fake bookings, no Google calls (local dev only) |
| `CORS_ORIGINS` | comma-separated allowed origins |

### Google Calendar setup (one-time)

1. In [Google Cloud Console](https://console.cloud.google.com/) create a
   project and enable the **Google Calendar API**.
2. Configure the OAuth consent screen (External, add your Google account as a
   test user), then create **OAuth client ID → Desktop app** credentials.
3. Get a refresh token for the owner's account:

   ```bash
   cd backend
   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \
     uv run python scripts/get_google_refresh_token.py
   ```

4. Put the three values into `backend/.env` (or the host's secrets).

The event is created in the owner's primary calendar with a Meet link;
`sendUpdates=all` emails the invitation to the visitor and the owner. Before
booking, the agent checks the slot via the FreeBusy API.

### Deploying the backend

Any Docker host works:

```bash
cd backend
docker build -t vsezol-agent .
docker run -p 8000:8000 --env-file .env vsezol-agent
```

The container respects `PORT`, so Railway/Render/Fly work out of the box.
After deploying, set the repository variable `API_URL` to the backend's
public URL (e.g. `https://agent.example.com`) so the Pages build points at it.

## Deployment (frontend)

Pushing to `master` triggers `.github/workflows/deploy.yml`: it builds
`frontend/` (with `VITE_API_URL` from the `API_URL` repo variable) and pushes
`frontend/dist` to the `gh-pages` branch via the `TOKEN` secret.
