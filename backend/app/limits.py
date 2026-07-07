"""In-process abuse backstops: LLM circuit breaker and booking caps.

These are global ceilings that hold even if per-IP limits are evaded (e.g.
rotating IPs), so an attacker can never burn more than a fixed amount of
tokens or flood the calendar. Counters live in process memory — on a single
Railway instance that's exact; if scaled to N instances each keeps its own
window, so set limits with that in mind.
"""

import threading
import time
from collections import defaultdict, deque

from .config import settings

HOUR = 3600.0
DAY = 86400.0


class SlidingCounter:
    """Counts events in a rolling window; `allow` checks, `record` commits."""

    def __init__(self, limit: int, window_seconds: float) -> None:
        self.limit = limit
        self.window = window_seconds
        self._hits: deque[float] = deque()
        self._lock = threading.Lock()

    def _trim(self, now: float) -> None:
        while self._hits and now - self._hits[0] > self.window:
            self._hits.popleft()

    def allow(self) -> bool:
        with self._lock:
            now = time.monotonic()
            self._trim(now)
            return len(self._hits) < self.limit

    def record(self) -> None:
        with self._lock:
            now = time.monotonic()
            self._trim(now)
            self._hits.append(now)

    def count(self) -> int:
        with self._lock:
            self._trim(time.monotonic())
            return len(self._hits)


class BookingLimiter:
    """Global-per-day and per-email booking ceilings."""

    def __init__(self, per_day: int, per_email: int) -> None:
        self.per_day = per_day
        self.per_email = per_email
        self._global: deque[float] = deque()
        self._by_email: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def _trim(self, hits: deque[float], now: float) -> None:
        while hits and now - hits[0] > DAY:
            hits.popleft()

    def check(self, email: str) -> str | None:
        """Return a reason string if booking is not allowed, else None."""
        with self._lock:
            now = time.monotonic()
            self._trim(self._global, now)
            if len(self._global) >= self.per_day:
                return "GLOBAL_DAILY_LIMIT"
            hits = self._by_email[email.lower()]
            self._trim(hits, now)
            if len(hits) >= self.per_email:
                return "PER_EMAIL_LIMIT"
            return None

    def record(self, email: str) -> None:
        with self._lock:
            now = time.monotonic()
            self._global.append(now)
            self._by_email[email.lower()].append(now)


# Shared singletons. Global ceilings that hold across all visitors.
llm_breaker = SlidingCounter(settings.global_llm_calls_per_hour, HOUR)
booking_limiter = BookingLimiter(
    settings.global_bookings_per_day, settings.bookings_per_email
)
