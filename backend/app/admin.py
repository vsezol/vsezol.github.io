import secrets
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from .admin_config import AgentConfig, store
from .config import settings

router = APIRouter()
security = HTTPBasic()

# The admin UI is the React app built together with the chat frontend
# (frontend/admin.html entry). In Docker the bundle is copied to
# /app/static_site; locally we fall back to frontend/dist.
_CANDIDATE_DIRS = (
    Path(__file__).resolve().parent.parent / "static_site",
    Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
)


def static_site_dir() -> Path | None:
    for candidate in _CANDIDATE_DIRS:
        if (candidate / "admin.html").is_file():
            return candidate
    return None


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


@router.get("/admin")
def admin_page(_: None = Depends(require_admin)) -> FileResponse:
    site = static_site_dir()
    if site is None:
        raise HTTPException(
            status_code=503,
            detail="Admin UI bundle is missing — build the frontend first.",
        )
    return FileResponse(site / "admin.html")


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
