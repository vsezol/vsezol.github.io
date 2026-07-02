import secrets

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from .admin_config import AgentConfig, store
from .config import settings

router = APIRouter()
security = HTTPBasic()


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
