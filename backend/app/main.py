import logging
from zoneinfo import ZoneInfo

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from pydantic_ai.messages import (
    ModelMessagesTypeAdapter,
    ModelRequest,
    UserPromptPart,
)
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
from .rate_limit import RateLimiter
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

rate_limiter = RateLimiter(
    settings.rate_limit_requests, settings.rate_limit_window_seconds
)

LIMIT_REACHED_MESSAGE = (
    "This conversation has reached its message limit — please refresh the "
    "page to start a new one. 🙏\n\n"
    "Лимит сообщений для этой беседы исчерпан — обновите страницу, чтобы "
    "начать новую. 🙏"
)


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        client_ip = request.headers.get(
            "x-forwarded-for", request.client.host if request.client else "?"
        ).split(",")[0].strip()
        if not rate_limiter.allow(client_ip):
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
async def chat(req: ChatRequest) -> ChatResponse:
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

        user_turns = sum(
            1
            for m in history
            if isinstance(m, ModelRequest)
            and any(isinstance(p, UserPromptPart) for p in m.parts)
        )
        if user_turns >= settings.max_user_messages:
            return ChatResponse(
                reply=TextReply(message=LIMIT_REACHED_MESSAGE),
                history=req.history,
            )

    deps = AgentDeps(
        client_timezone=_validate_timezone(req.client_timezone),
        locale="ru" if (req.client_locale or "").lower().startswith("ru") else "en",
    )

    try:
        result = await agent.run(
            req.message,
            deps=deps,
            message_history=history,
            usage_limits=UsageLimits(request_limit=8),
        )
    except Exception:
        logger.exception("Agent run failed")
        raise HTTPException(
            status_code=502,
            detail="The agent is temporarily unavailable. Please try again.",
        )

    return ChatResponse(
        reply=_build_reply(result.output, deps),
        history=ModelMessagesTypeAdapter.dump_python(
            result.all_messages(), mode="json"
        ),
    )
