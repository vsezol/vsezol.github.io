"""Server-side chat sessions: visitors resume conversations by session id.

Each session is a JSON file next to the admin config (on Railway — the
/data volume): the pydantic-ai message history plus a UI transcript the
frontend re-renders on return visits. Sessions idle for longer than the
TTL are dropped.
"""

import json
import logging
import re
import threading
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from .admin_config import store
from .config import settings

logger = logging.getLogger(__name__)

VALID_ID = re.compile(r"^[0-9a-f]{32}$")

SWEEP_INTERVAL_SECONDS = 15 * 60

# generous cap so a single session file can't grow unbounded
MAX_TRANSCRIPT_ENTRIES = 200


def _now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class Session:
    id: str
    history: list[Any] = field(default_factory=list)
    transcript: list[dict[str, Any]] = field(default_factory=list)
    last_active: datetime = field(default_factory=_now)


class SessionStore:
    def __init__(self, directory: Path, ttl_days: int) -> None:
        self.dir = directory
        self.ttl = timedelta(days=ttl_days)
        self._lock = threading.Lock()
        self._last_sweep = 0.0

    def _path(self, session_id: str) -> Path:
        return self.dir / f"{session_id}.json"

    def create(self) -> Session:
        return Session(id=uuid.uuid4().hex)

    def load(self, session_id: str) -> Session | None:
        if not VALID_ID.match(session_id):
            return None
        try:
            data = json.loads(self._path(session_id).read_text(encoding="utf-8"))
            last_active = datetime.fromisoformat(data["last_active"])
        except (OSError, ValueError, KeyError):
            return None
        if _now() - last_active > self.ttl:
            self.delete(session_id)
            return None
        return Session(
            id=session_id,
            history=data.get("history") or [],
            transcript=data.get("transcript") or [],
            last_active=last_active,
        )

    def save(self, session: Session) -> None:
        session.last_active = _now()
        session.transcript = session.transcript[-MAX_TRANSCRIPT_ENTRIES:]
        payload = json.dumps(
            {
                "history": session.history,
                "transcript": session.transcript,
                "last_active": session.last_active.isoformat(),
            },
            ensure_ascii=False,
        )
        with self._lock:
            try:
                self.dir.mkdir(parents=True, exist_ok=True)
                self._path(session.id).write_text(payload, encoding="utf-8")
            except OSError:
                logger.exception("Failed to persist session %s", session.id)

    def delete(self, session_id: str) -> None:
        try:
            self._path(session_id).unlink()
        except OSError:
            pass

    def sweep(self, force: bool = False) -> None:
        """Drop sessions idle beyond the TTL; throttled to run occasionally."""
        with self._lock:
            now = time.monotonic()
            if not force and now - self._last_sweep < SWEEP_INTERVAL_SECONDS:
                return
            self._last_sweep = now
        cutoff = _now() - self.ttl
        try:
            files = list(self.dir.glob("*.json"))
        except OSError:
            return
        dropped = 0
        for path in files:
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                last_active = datetime.fromisoformat(data["last_active"])
                expired = last_active < cutoff
            except (OSError, ValueError, KeyError):
                expired = True  # unreadable/corrupt — drop it
            if expired:
                try:
                    path.unlink()
                    dropped += 1
                except OSError:
                    pass
        if dropped:
            logger.info("Swept %d expired session(s)", dropped)


session_store = SessionStore(
    store.path.parent / "sessions", ttl_days=settings.session_ttl_days
)
