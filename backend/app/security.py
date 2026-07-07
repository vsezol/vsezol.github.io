"""Edge/browser-proof checks: Cloudflare Turnstile + edge shared secret.

Both are no-ops until their env vars are set, so the app can be deployed
before Cloudflare is wired up and switched on afterwards without a redeploy.
"""

import logging

import httpx
from fastapi import Request

from .config import settings

logger = logging.getLogger(__name__)

TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
TURNSTILE_HEADER = "cf-turnstile-response"


def edge_secret_ok(request: Request) -> bool:
    """True unless an edge secret is configured and the header doesn't match.

    When `EDGE_SECRET` is set, Cloudflare injects it as a header on every
    proxied request; a request without it reached Railway directly, bypassing
    Cloudflare — reject it.
    """
    if not settings.edge_secret:
        return True
    got = request.headers.get(settings.edge_secret_header, "")
    return got == settings.edge_secret


async def turnstile_ok(request: Request, token: str | None) -> bool:
    """Verify a Cloudflare Turnstile token. No-op if no secret configured."""
    if not settings.turnstile_secret:
        return True
    if not token:
        return False
    data = {"secret": settings.turnstile_secret, "response": token}
    client_ip = request.headers.get("cf-connecting-ip")
    if client_ip:
        data["remoteip"] = client_ip
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(TURNSTILE_VERIFY_URL, data=data)
        return bool(resp.json().get("success"))
    except Exception:
        # Don't take the whole site down if Cloudflare's verify endpoint is
        # briefly unreachable — log and allow this one through.
        logger.warning("Turnstile verify unreachable; allowing request", exc_info=True)
        return True


def client_ip(request: Request) -> str:
    """Real client IP: prefer Cloudflare's header, which (once non-CF traffic
    is rejected) cannot be spoofed, unlike the client-settable XFF."""
    cf = request.headers.get("cf-connecting-ip")
    if cf:
        return cf.strip()
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "?"
