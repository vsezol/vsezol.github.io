"""Editable agent/site configuration, managed via the /admin panel."""

import json
import logging
import re
import threading
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from .config import settings

logger = logging.getLogger(__name__)

TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")

DEFAULT_GREETING = (
    "This is my AI agent — it can tell you about me\n"
    "and book a meeting with me."
)

DEFAULT_BIO = (
    "Vsevolod Zolotov is a Senior AI Engineer who builds LLM-powered "
    "products and agents."
)


class ButtonCfg(BaseModel):
    label: str = Field(max_length=40)
    kind: Literal["link", "about"] = "link"
    url: str = Field(default="", max_length=300)


class DayCfg(BaseModel):
    on: bool = True
    start: str = "10:00"
    end: str = "18:00"

    @field_validator("start", "end")
    @classmethod
    def _valid_time(cls, v: str) -> str:
        if not TIME_RE.match(v):
            raise ValueError(f"invalid time: {v!r}")
        return v


def _default_buttons() -> list[ButtonCfg]:
    return [
        ButtonCfg(label="About Vsevolod", kind="about"),
        ButtonCfg(label="GitHub ↗", kind="link", url="https://github.com/vsezol"),
        ButtonCfg(
            label="LinkedIn ↗", kind="link", url="https://www.linkedin.com/in/vsezol"
        ),
        ButtonCfg(label="Telegram ↗", kind="link", url="https://t.me/vsezol"),
    ]


def _default_schedule() -> list[DayCfg]:
    workday = {"on": True, "start": "10:00", "end": "18:00"}
    dayoff = {"on": False, "start": "10:00", "end": "18:00"}
    return [DayCfg(**workday) for _ in range(5)] + [DayCfg(**dayoff) for _ in range(2)]


class AgentConfig(BaseModel):
    title: str = Field(default="Hi, I'm Vsevolod", max_length=60)
    subtitle: str = Field(
        default="Senior AI Engineer at OTP Group", max_length=100
    )
    # Data URL (small JPEG) or None for the built-in photo
    avatar: str | None = Field(default=None, max_length=300_000)
    greeting: str = Field(default=DEFAULT_GREETING, max_length=1000)
    bio: str = Field(default=DEFAULT_BIO, max_length=8000)
    buttons: list[ButtonCfg] = Field(default_factory=_default_buttons, max_length=8)
    schedule: list[DayCfg] = Field(default_factory=_default_schedule)
    slot_minutes: Literal[15, 30, 45, 60] = 30
    tz_label: str = Field(default="GMT+3 (Moscow)", max_length=60)

    @field_validator("schedule")
    @classmethod
    def _seven_days(cls, v: list[DayCfg]) -> list[DayCfg]:
        if len(v) != 7:
            raise ValueError("schedule must have exactly 7 days (Mon..Sun)")
        return v


def _resolve_path() -> Path:
    if settings.config_path:
        return Path(settings.config_path)
    if Path("/data").is_dir():
        return Path("/data/agent_config.json")
    logger.warning(
        "No persistent volume at /data — config changes will be lost on redeploy"
    )
    return Path("agent_config.json")


class ConfigStore:
    def __init__(self, path: Path) -> None:
        self.path = path
        self._lock = threading.Lock()
        self._cache: AgentConfig | None = None
        self._mtime: float | None = None

    def load(self) -> AgentConfig:
        with self._lock:
            try:
                mtime = self.path.stat().st_mtime
            except OSError:
                return self._cache or AgentConfig()
            if self._cache is not None and mtime == self._mtime:
                return self._cache
            try:
                data = json.loads(self.path.read_text(encoding="utf-8"))
                self._cache = AgentConfig.model_validate(data)
                self._mtime = mtime
            except Exception:
                logger.exception("Failed to load config from %s, using defaults", self.path)
                self._cache = AgentConfig()
            return self._cache

    def save(self, cfg: AgentConfig) -> None:
        with self._lock:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            self.path.write_text(
                json.dumps(cfg.model_dump(), ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            self._cache = cfg
            try:
                self._mtime = self.path.stat().st_mtime
            except OSError:
                self._mtime = None


store = ConfigStore(_resolve_path())
