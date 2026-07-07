import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel

from .admin_config import AgentConfig, store
from .calendar_service import delete_events, list_agent_events
from .config import settings

router = APIRouter()
security = HTTPBasic()

# Cap how far ahead we scan/delete in one call.
MAX_CLEANUP_DAYS = 400


def require_admin(
    credentials: HTTPBasicCredentials = Depends(security),
) -> None:
    if not settings.admin_password:
        raise HTTPException(
            status_code=503,
            detail="Admin panel is disabled: set the ADMIN_PASSWORD env var.",
        )
    user_ok = secrets.compare_digest(
        credentials.username.encode(), settings.admin_user.encode()
    )
    password_ok = secrets.compare_digest(
        credentials.password.encode(), settings.admin_password.encode()
    )
    if not (user_ok and password_ok):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )


@router.get("/admin", include_in_schema=False)
def admin_page() -> RedirectResponse:
    """The admin UI lives in the site SPA at /#admin."""
    return RedirectResponse(url=f"{settings.site_url}/#admin", status_code=307)


@router.get("/admin/api/config")
def get_config(_: None = Depends(require_admin)) -> AgentConfig:
    return store.load()


@router.put("/admin/api/config")
def put_config(cfg: AgentConfig, _: None = Depends(require_admin)) -> dict[str, str]:
    try:
        store.save(cfg)
    except OSError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not persist the config ({exc}). "
            "Attach a volume at /data on Railway.",
        )
    return {"status": "saved"}


def _cleanup_window(days: int) -> tuple[datetime, datetime]:
    days = max(1, min(days, MAX_CLEANUP_DAYS))
    now = datetime.now(timezone.utc)
    return now, now + timedelta(days=days)


@router.get("/admin/api/spam-meetings")
def preview_spam_meetings(
    days: int = 90, _: None = Depends(require_admin)
) -> dict:
    """Dry run: agent-created meetings in the next `days` days (nothing deleted)."""
    time_min, time_max = _cleanup_window(days)
    try:
        events = list_agent_events(time_min, time_max)
    except Exception as exc:  # calendar/auth errors → surface, don't 500 opaquely
        raise HTTPException(status_code=502, detail=f"Calendar error: {exc}")
    return {"count": len(events), "events": events}


class DeleteSpamRequest(BaseModel):
    days: int = 90
    event_ids: list[str] | None = None


@router.post("/admin/api/spam-meetings/delete")
def delete_spam_meetings(
    req: DeleteSpamRequest, _: None = Depends(require_admin)
) -> dict:
    """Delete agent-created meetings — the given ids, or all in the window."""
    try:
        ids = req.event_ids
        if ids is None:
            time_min, time_max = _cleanup_window(req.days)
            ids = [e["id"] for e in list_agent_events(time_min, time_max)]
        deleted = delete_events(ids)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Calendar error: {exc}")
    return {"deleted": deleted}
