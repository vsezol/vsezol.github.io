import asyncio
import logging
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from pydantic_ai.exceptions import ModelHTTPError
from pydantic_ai.messages import ModelMessagesTypeAdapter
from pydantic_ai.usage import UsageLimits

from .admin import router as admin_router
from .admin_config import store
from .agent import (
    AgentDeps,
    AskConfirm,
    AskDateTime,
    AskEmail,
    agent,
    strip_widget_echo,
)
from .config import settings
from .limits import llm_breaker
from .rate_limit import RateLimiter
from .security import client_ip, edge_secret_ok, turnstile_ok
from .sessions import session_store
from .schemas import (
    AskConfirmReply,
    AskDateTimeReply,
    AskEmailReply,
    BookedReply,
    ChatRequest,
    ChatResponse,
    Reply,
    TextReply,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Vsevolod's AI Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_router)

# Coarse per-IP anti-flood over all /api/ paths.
rate_limiter = RateLimiter(
    settings.rate_limit_requests, settings.rate_limit_window_seconds
)
# Chat messages per IP per hour (the visible "20/hour" cap).
chat_hourly = RateLimiter(settings.messages_per_hour, 3600)

HOURLY_LIMIT_MESSAGE = (
    "You've hit the hourly message limit — it resets within an hour. "
    "Thanks for your patience! 🙏\n\n"
    "Вы достигли часового лимита сообщений — он восстановится в течение "
    "часа. Спасибо за терпение! 🙏"
)

BUSY_MESSAGE = (
    "The agent is handling a lot of requests right now — please try again "
    "in a few minutes. 🙏\n\n"
    "Агент сейчас перегружен запросами — попробуйте, пожалуйста, через "
    "несколько минут. 🙏"
)

DISABLED_MESSAGE = (
    "The chat is temporarily unavailable. Please check back soon. 🙏\n\n"
    "Чат временно недоступен. Загляните чуть позже. 🙏"
)


@app.middleware("http")
async def edge_and_flood_middleware(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        # reject anything that bypassed Cloudflare (once EDGE_SECRET is set)
        if not edge_secret_ok(request):
            return JSONResponse({"detail": "Forbidden"}, status_code=403)
        if not rate_limiter.allow(client_ip(request)):
            return JSONResponse(
                {"detail": "Too many requests, please slow down."},
                status_code=429,
            )
    return await call_next(request)


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/config")
def public_config() -> dict:
    """Public site config consumed by the chat frontend."""
    cfg = store.load()
    return {
        "title": cfg.title,
        "subtitle": cfg.subtitle,
        "title_ru": cfg.title_ru,
        "subtitle_ru": cfg.subtitle_ru,
        "avatar": cfg.avatar,
        "greeting": cfg.greeting,
        "greeting_ru": cfg.greeting_ru,
        "buttons": [b.model_dump() for b in cfg.buttons],
        "schedule": [d.model_dump() for d in cfg.schedule],
        "slot_minutes": cfg.slot_minutes,
        "tz_label": cfg.tz_label,
    }


ASK_TYPES = {"ask_email", "ask_datetime", "ask_confirm"}


def _resolve_pending_widget(transcript: list[dict], message: str) -> None:
    """Mark the latest unresolved widget entry with the visitor's answer.

    "[widget] ..." messages answer the most recent ask_* reply; the stored
    value lets the frontend render a summary chip on session restore.
    """
    for entry in reversed(transcript):
        if entry.get("kind") != "agent":
            continue
        reply = entry.get("reply") or {}
        if reply.get("type") not in ASK_TYPES:
            continue
        if entry.get("resolved") is None:
            if message.startswith(
                ("[widget] I confirm my email:", "[widget] I confirm the meeting time:")
            ):
                entry["resolved"] = message.split(":", 1)[1].strip()
            elif message.startswith("[widget] Confirmed"):
                entry["resolved"] = "booked"
            else:
                entry["resolved"] = "declined"
        return


@app.get("/api/session/{session_id}")
def get_session(session_id: str) -> dict:
    """Transcript of a previous conversation, for restoring the chat UI."""
    session = session_store.load(session_id)
    if session is None or not session.transcript:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session_id": session.id, "transcript": session.transcript}


# Gemini occasionally 503s ("high demand") on both the primary and the
# fallback model at once — worth a couple of quick retries before giving up.
TRANSIENT_STATUS = {429, 500, 502, 503, 504}
AGENT_RUN_ATTEMPTS = 3
RETRY_BACKOFF_SECONDS = 0.8


def _is_transient(exc: BaseException) -> bool:
    if isinstance(exc, ModelHTTPError):
        return exc.status_code in TRANSIENT_STATUS
    if isinstance(exc, BaseExceptionGroup):
        return any(_is_transient(e) for e in exc.exceptions)
    return False


def _validate_timezone(tz: str | None) -> str:
    if not tz:
        return "UTC"
    try:
        ZoneInfo(tz)
    except (KeyError, ValueError):
        return "UTC"
    return tz


def _build_reply(
    output: str | AskEmail | AskDateTime | AskConfirm, deps: AgentDeps
) -> Reply:
    if deps.booking is not None:
        booking = deps.booking
        message = (
            strip_widget_echo(output) if isinstance(output, str) else ""
        ) or "Your meeting is booked! 🎉"
        return BookedReply(
            message=message,
            meet_url=booking.meet_url,
            start=booking.start.isoformat(),
            end=booking.end.isoformat(),
            email=booking.visitor_email,
        )
    if isinstance(output, AskEmail):
        return AskEmailReply(
            message=strip_widget_echo(output.message), prefill=output.prefill
        )
    if isinstance(output, AskDateTime):
        return AskDateTimeReply(
            message=strip_widget_echo(output.message),
            prefill_start=(
                output.prefill_start.isoformat() if output.prefill_start else None
            ),
            duration_minutes=output.duration_minutes,
        )
    if isinstance(output, AskConfirm):
        return AskConfirmReply(
            message=strip_widget_echo(output.message),
            start=output.start.isoformat(),
            duration_minutes=output.duration_minutes,
            email=output.email,
        )
    return TextReply(message=strip_widget_echo(output))


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, request: Request) -> ChatResponse:
    if not settings.chat_enabled:
        return ChatResponse(reply=TextReply(message=DISABLED_MESSAGE), history=[])

    # Proof this came from a real browser (no-op until Turnstile is set up).
    if not await turnstile_ok(request, req.turnstile_token):
        raise HTTPException(status_code=403, detail="Verification required")

    # 20 messages / IP / hour — no LLM call on exceed.
    if not chat_hourly.allow(client_ip(request)):
        return ChatResponse(
            reply=TextReply(message=HOURLY_LIMIT_MESSAGE),
            history=req.history or [],
            session_id=req.session_id,
        )

    history = None
    if req.history:
        if len(req.history) > settings.max_history_messages:
            raise HTTPException(
                status_code=413,
                detail="This conversation is too long — please refresh the page.",
            )
        try:
            history = ModelMessagesTypeAdapter.validate_python(req.history)
        except ValidationError:
            raise HTTPException(status_code=400, detail="Invalid history payload")

    # the server-held session history wins over the client copy
    session = session_store.load(req.session_id) if req.session_id else None
    if session is None:
        session = session_store.create()
    if session.history:
        try:
            history = ModelMessagesTypeAdapter.validate_python(session.history)
        except ValidationError:
            logger.warning("Corrupt history in session %s, resetting", session.id)
            session.history = []

    # Global circuit breaker: hard ceiling on LLM spend across all visitors.
    if not llm_breaker.allow():
        logger.warning("LLM circuit breaker tripped — refusing without a call")
        return ChatResponse(
            reply=TextReply(message=BUSY_MESSAGE),
            history=req.history or [],
            session_id=session.id,
        )

    deps = AgentDeps(
        client_timezone=_validate_timezone(req.client_timezone),
        locale="ru" if (req.client_locale or "").lower().startswith("ru") else "en",
    )

    result = None
    llm_breaker.record()
    for attempt in range(1, AGENT_RUN_ATTEMPTS + 1):
        try:
            result = await agent.run(
                req.message,
                deps=deps,
                message_history=history,
                usage_limits=UsageLimits(request_limit=8),
            )
            break
        except Exception as exc:
            # never re-run a conversation that already created a booking —
            # the meeting exists, so tell the visitor instead of erroring
            if deps.booking is not None:
                logger.exception("Agent run failed after booking; replying booked")
                return ChatResponse(
                    reply=_build_reply("", deps),
                    history=req.history or [],
                    session_id=session.id,
                )
            if attempt < AGENT_RUN_ATTEMPTS and _is_transient(exc):
                logger.warning(
                    "Transient model error (attempt %d/%d): %s",
                    attempt,
                    AGENT_RUN_ATTEMPTS,
                    exc,
                )
                await asyncio.sleep(RETRY_BACKOFF_SECONDS * attempt)
                continue
            logger.exception("Agent run failed")
            raise HTTPException(
                status_code=502,
                detail="The agent is temporarily unavailable. Please try again.",
            )

    reply = _build_reply(result.output, deps)

    session.history = ModelMessagesTypeAdapter.dump_python(
        result.all_messages(), mode="json"
    )
    if req.message.startswith("[widget]"):
        _resolve_pending_widget(session.transcript, req.message)
    else:
        session.transcript.append({"kind": "user", "text": req.message})
    session.transcript.append(
        {"kind": "agent", "reply": reply.model_dump(), "resolved": None}
    )
    session_store.save(session)
    session_store.sweep()

    return ChatResponse(reply=reply, history=session.history, session_id=session.id)
