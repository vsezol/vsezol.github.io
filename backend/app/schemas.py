from typing import Annotated, Any, Literal, Union

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[Any] | None = None
    client_timezone: str | None = None
    # Browser locale, e.g. "ru-RU" — sets the language the agent starts in
    client_locale: str | None = None
    # Server-side session to resume; a new one is created when absent/expired
    session_id: str | None = Field(default=None, max_length=64)
    # Cloudflare Turnstile token proving the request came from a real browser
    turnstile_token: str | None = Field(default=None, max_length=4096)


class TextReply(BaseModel):
    type: Literal["text"] = "text"
    message: str


class AskEmailReply(BaseModel):
    type: Literal["ask_email"] = "ask_email"
    message: str
    prefill: str | None = None


class AskDateTimeReply(BaseModel):
    type: Literal["ask_datetime"] = "ask_datetime"
    message: str
    prefill_start: str | None = None
    duration_minutes: int = 30


class AskConfirmReply(BaseModel):
    type: Literal["ask_confirm"] = "ask_confirm"
    message: str
    start: str
    duration_minutes: int = 30
    email: str


class BookedReply(BaseModel):
    type: Literal["booked"] = "booked"
    message: str
    meet_url: str
    start: str
    end: str
    email: str


Reply = Annotated[
    Union[
        TextReply, AskEmailReply, AskDateTimeReply, AskConfirmReply, BookedReply
    ],
    Field(discriminator="type"),
]


class ChatResponse(BaseModel):
    reply: Reply
    history: list[Any]
    session_id: str | None = None
