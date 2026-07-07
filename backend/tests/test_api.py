import os
import tempfile

os.environ["DEMO_MODE"] = "true"
os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ["ADMIN_PASSWORD"] = "test-admin-pass"
os.environ["CONFIG_PATH"] = os.path.join(
    tempfile.mkdtemp(prefix="agent-test-"), "agent_config.json"
)
# Keep the shared in-process limiters out of the way of the suite; each
# limit is exercised in its own test by swapping in a small limiter.
os.environ["RATE_LIMIT_REQUESTS"] = "100000"
os.environ["MESSAGES_PER_HOUR"] = "100000"
os.environ["GLOBAL_LLM_CALLS_PER_HOUR"] = "100000"
os.environ["GLOBAL_BOOKINGS_PER_DAY"] = "100000"
os.environ["BOOKINGS_PER_EMAIL"] = "100000"

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from pydantic_ai.messages import ModelResponse, TextPart, ToolCallPart
from pydantic_ai.models.function import FunctionModel


def _text_model(text: str) -> FunctionModel:
    return FunctionModel(lambda messages, info: ModelResponse(parts=[TextPart(text)]))


def _book_then_speak():
    """Scripted model: first turn calls book_meeting, then speaks the result."""
    from zoneinfo import ZoneInfo

    start = datetime.now(ZoneInfo("Europe/Moscow")).replace(
        hour=12, minute=0, second=0, microsecond=0
    ) + timedelta(days=1)
    while start.weekday() > 4:
        start += timedelta(days=1)
    state = {"calls": 0}

    def model(messages, info):
        state["calls"] += 1
        if state["calls"] == 1:
            return ModelResponse(
                parts=[
                    ToolCallPart(
                        "book_meeting",
                        {
                            "visitor_email": "visitor@example.com",
                            "start": start.isoformat(),
                            "duration_minutes": 30,
                        },
                    )
                ]
            )
        return ModelResponse(parts=[TextPart("All set!")])

    return model

from app.agent import AgentDeps, AskConfirm, AskDateTime, AskEmail
from app.agent import agent as booking_agent
from app.calendar_service import create_meeting
from app.main import _build_reply, app

client = TestClient(app)


def test_text_reply_and_history_roundtrip():
    with booking_agent.override(model=_text_model("Hello!")):
        r1 = client.post(
            "/api/chat",
            json={
                "message": "hi",
                "history": None,
                "client_timezone": "Europe/Moscow",
            },
        )
        assert r1.status_code == 200
        data = r1.json()
        assert data["reply"]["type"] == "text"
        assert data["reply"]["message"] == "Hello!"
        assert isinstance(data["history"], list) and data["history"]

        r2 = client.post(
            "/api/chat",
            json={
                "message": "one more",
                "history": data["history"],
                "client_timezone": "Europe/Moscow",
            },
        )
        assert r2.status_code == 200
        assert len(r2.json()["history"]) > len(data["history"])


def test_invalid_history_rejected():
    with booking_agent.override(model=_text_model("x")):
        r = client.post(
            "/api/chat",
            json={"message": "hi", "history": [{"bogus": True}]},
        )
        assert r.status_code == 400


def test_widget_reply_mapping():
    deps = AgentDeps(client_timezone="UTC")

    reply = _build_reply(AskEmail(message="Your email?", prefill="a@b.co"), deps)
    assert reply.type == "ask_email"
    assert reply.prefill == "a@b.co"

    start = datetime(2030, 1, 15, 15, 0, tzinfo=timezone.utc)
    reply = _build_reply(
        AskDateTime(message="Pick a time", prefill_start=start), deps
    )
    assert reply.type == "ask_datetime"
    assert reply.prefill_start == start.isoformat()
    assert reply.duration_minutes == 30

    reply = _build_reply(
        AskConfirm(message="Book it?", start=start, email="a@b.co"), deps
    )
    assert reply.type == "ask_confirm"
    assert reply.start == start.isoformat()
    assert reply.email == "a@b.co"


def test_booking_flow_via_tool_call():
    from zoneinfo import ZoneInfo

    # next weekday at 12:00 owner time — inside the default availability
    start = datetime.now(ZoneInfo("Europe/Moscow")).replace(
        hour=12, minute=0, second=0, microsecond=0
    ) + timedelta(days=1)
    while start.weekday() > 4:
        start += timedelta(days=1)
    state = {"calls": 0}

    def scripted_model(messages, info):
        state["calls"] += 1
        if state["calls"] == 1:
            return ModelResponse(
                parts=[
                    ToolCallPart(
                        "book_meeting",
                        {
                            "visitor_email": "visitor@example.com",
                            "start": start.isoformat(),
                            "duration_minutes": 30,
                        },
                    )
                ]
            )
        return ModelResponse(parts=[TextPart("All set — see you soon!")])

    with booking_agent.override(model=FunctionModel(scripted_model)):
        r = client.post(
            "/api/chat",
            json={
                "message": "[widget] I confirm the meeting time",
                "client_timezone": "UTC",
            },
        )
    assert r.status_code == 200
    reply = r.json()["reply"]
    assert reply["type"] == "booked"
    assert reply["meet_url"].startswith("https://meet.google.com/")
    assert reply["email"] == "visitor@example.com"
    assert reply["message"] == "All set — see you soon!"


def test_widget_echo_stripped_from_reply():
    echo = (
        "[widget] I confirm the meeting time: 2030-01-15T15:00:00+05:00\n"
        "Отлично, почти готово!"
    )
    with booking_agent.override(model=_text_model(echo)):
        r = client.post(
            "/api/chat", json={"message": "ok", "client_timezone": "UTC"}
        )
    assert r.status_code == 200
    assert r.json()["reply"]["message"] == "Отлично, почти готово!"


def test_plain_text_email_ask_becomes_widget():
    text = "Мне нужен ваш адрес электронной почты, чтобы отправить приглашение."
    with booking_agent.override(model=_text_model(text)):
        r = client.post(
            "/api/chat",
            json={"message": "завтра в 15:00", "client_timezone": "UTC"},
        )
    assert r.status_code == 200
    reply = r.json()["reply"]
    assert reply["type"] == "ask_email"
    assert "почт" in reply["message"]


def test_plain_text_time_ask_becomes_widget():
    text = "Когда вам будет удобно встретиться?"
    with booking_agent.override(model=_text_model(text)):
        r = client.post(
            "/api/chat",
            json={"message": "хочу встречу", "client_timezone": "UTC"},
        )
    assert r.status_code == 200
    assert r.json()["reply"]["type"] == "ask_datetime"


def _counting_model():
    from pydantic_ai.messages import ModelRequest as MReq
    from pydantic_ai.messages import UserPromptPart as UPart

    def fn(messages, info):
        n = sum(
            1
            for m in messages
            if isinstance(m, MReq) and any(isinstance(p, UPart) for p in m.parts)
        )
        return ModelResponse(parts=[TextPart(f"turn {n}")])

    return FunctionModel(fn)


def test_session_keeps_context_server_side():
    with booking_agent.override(model=_counting_model()):
        r1 = client.post(
            "/api/chat", json={"message": "hello", "client_timezone": "UTC"}
        )
        sid = r1.json()["session_id"]
        assert sid
        assert r1.json()["reply"]["message"] == "turn 1"

        # no client history at all — context comes from the server session
        r2 = client.post(
            "/api/chat",
            json={"message": "again", "session_id": sid, "client_timezone": "UTC"},
        )
    assert r2.json()["session_id"] == sid
    assert r2.json()["reply"]["message"] == "turn 2"

    r3 = client.get(f"/api/session/{sid}")
    assert r3.status_code == 200
    transcript = r3.json()["transcript"]
    assert [e["kind"] for e in transcript] == ["user", "agent", "user", "agent"]
    assert transcript[0]["text"] == "hello"

    assert client.get("/api/session/" + "0" * 32).status_code == 404


def test_widget_messages_resolve_transcript_entries():
    from app.main import _resolve_pending_widget

    transcript = [
        {"kind": "user", "text": "book me"},
        {"kind": "agent", "reply": {"type": "ask_email", "message": "?"}, "resolved": None},
    ]
    _resolve_pending_widget(transcript, "[widget] I confirm my email: a@b.co")
    assert transcript[1]["resolved"] == "a@b.co"

    transcript.append(
        {
            "kind": "agent",
            "reply": {"type": "ask_datetime", "message": "?"},
            "resolved": None,
        }
    )
    _resolve_pending_widget(
        transcript, "[widget] I confirm the meeting time: 2030-01-15T15:00:00+03:00"
    )
    assert transcript[2]["resolved"] == "2030-01-15T15:00:00+03:00"

    transcript.append(
        {
            "kind": "agent",
            "reply": {"type": "ask_confirm", "message": "?"},
            "resolved": None,
        }
    )
    _resolve_pending_widget(transcript, "[widget] I declined the booking confirmation.")
    assert transcript[3]["resolved"] == "declined"


def test_expired_session_is_dropped():
    import json as jsonlib
    from datetime import datetime, timedelta, timezone

    from app.sessions import session_store

    with booking_agent.override(model=_text_model("hi")):
        r = client.post("/api/chat", json={"message": "hi", "client_timezone": "UTC"})
    sid = r.json()["session_id"]

    path = session_store._path(sid)
    data = jsonlib.loads(path.read_text(encoding="utf-8"))
    data["last_active"] = (
        datetime.now(timezone.utc) - timedelta(days=8)
    ).isoformat()
    path.write_text(jsonlib.dumps(data), encoding="utf-8")

    assert client.get(f"/api/session/{sid}").status_code == 404
    assert not path.exists()

    # sweep removes stale files too
    path.write_text(jsonlib.dumps(data), encoding="utf-8")
    session_store.sweep(force=True)
    assert not path.exists()


def test_transient_503_is_retried():
    from pydantic_ai.exceptions import ModelHTTPError

    calls = {"n": 0}

    def flaky(messages, info):
        calls["n"] += 1
        if calls["n"] == 1:
            raise ModelHTTPError(
                status_code=503,
                model_name="gemini-2.5-flash",
                body={"error": {"status": "UNAVAILABLE"}},
            )
        return ModelResponse(parts=[TextPart("Recovered!")])

    with booking_agent.override(model=FunctionModel(flaky)):
        r = client.post(
            "/api/chat", json={"message": "hi", "client_timezone": "UTC"}
        )
    assert r.status_code == 200
    assert r.json()["reply"]["message"] == "Recovered!"
    assert calls["n"] == 2


def test_non_transient_error_fails_fast():
    calls = {"n": 0}

    def broken(messages, info):
        calls["n"] += 1
        raise RuntimeError("boom")

    with booking_agent.override(model=FunctionModel(broken)):
        r = client.post(
            "/api/chat", json={"message": "hi", "client_timezone": "UTC"}
        )
    assert r.status_code == 502
    assert calls["n"] == 1


def test_hourly_message_limit_and_localization():
    import app.main as main_mod
    from app.rate_limit import RateLimiter

    original = main_mod.chat_hourly
    main_mod.chat_hourly = RateLimiter(1, 3600)
    try:
        with booking_agent.override(model=_text_model("hi")):
            ip = {"cf-connecting-ip": "203.0.113.7"}
            r1 = client.post(
                "/api/chat", json={"message": "one", "client_timezone": "UTC"}, headers=ip
            )
            assert r1.status_code == 200 and "hourly" not in r1.json()["reply"]["message"]
            # second (English) message over the limit → English text, no emoji
            r2 = client.post(
                "/api/chat", json={"message": "two", "client_timezone": "UTC"}, headers=ip
            )
            msg = r2.json()["reply"]["message"]
            assert "hourly message limit" in msg
            assert "🙏" not in msg and "час" not in msg

            # a different IP is not throttled
            r3 = client.post(
                "/api/chat",
                json={"message": "three", "client_timezone": "UTC"},
                headers={"cf-connecting-ip": "203.0.113.8"},
            )
            assert "hourly message limit" not in r3.json()["reply"]["message"]

            # a Russian over-limit message → Russian text
            r4 = client.post(
                "/api/chat", json={"message": "привет", "client_timezone": "UTC"}, headers=ip
            )
            rmsg = r4.json()["reply"]["message"]
            assert "часового лимита" in rmsg and "🙏" not in rmsg
    finally:
        main_mod.chat_hourly = original


def test_hourly_limit_is_per_session_not_ip():
    """Visitors sharing a carrier/CGNAT IP must not drain each other's budget,
    and widget events don't count."""
    import app.main as main_mod
    from app.rate_limit import RateLimiter

    original = main_mod.chat_hourly
    main_mod.chat_hourly = RateLimiter(1, 3600)
    try:
        with booking_agent.override(model=_text_model("hi")):
            ip = {"cf-connecting-ip": "198.51.100.5"}  # same IP for everyone
            a = client.post(
                "/api/chat",
                json={"message": "hi", "session_id": "a" * 32, "client_timezone": "UTC"},
                headers=ip,
            )
            b = client.post(
                "/api/chat",
                json={"message": "hi", "session_id": "b" * 32, "client_timezone": "UTC"},
                headers=ip,
            )
            # different sessions → neither throttled despite the shared IP
            assert "hourly" not in a.json()["reply"]["message"]
            assert "hourly" not in b.json()["reply"]["message"]

            # widget events never count toward the cap
            for _ in range(3):
                w = client.post(
                    "/api/chat",
                    json={
                        "message": "[widget] Confirmed — book the meeting.",
                        "session_id": "a" * 32,
                        "client_timezone": "UTC",
                    },
                    headers=ip,
                )
                assert "hourly" not in w.json()["reply"]["message"]
    finally:
        main_mod.chat_hourly = original


def test_llm_circuit_breaker():
    import app.main as main_mod
    from app.limits import SlidingCounter

    original = main_mod.llm_breaker
    main_mod.llm_breaker = SlidingCounter(0, 3600)  # allow() always False
    try:
        called = {"n": 0}

        def model(messages, info):
            called["n"] += 1
            return ModelResponse(parts=[TextPart("should not run")])

        with booking_agent.override(model=FunctionModel(model)):
            r = client.post(
                "/api/chat",
                json={"message": "hi", "client_timezone": "UTC"},
                headers={"cf-connecting-ip": "203.0.113.9"},
            )
        assert r.status_code == 200
        msg = r.json()["reply"]["message"]
        assert "few minutes" in msg and "🙏" not in msg  # English, no emoji
        assert called["n"] == 0  # LLM never invoked
    finally:
        main_mod.llm_breaker = original


def test_chat_kill_switch():
    from app.config import settings

    settings.chat_enabled = False
    try:
        r = client.post("/api/chat", json={"message": "hi", "client_timezone": "UTC"})
        assert r.status_code == 200
        assert "temporarily unavailable" in r.json()["reply"]["message"]
        # Russian visitor gets the Russian variant
        r2 = client.post(
            "/api/chat", json={"message": "привет", "client_timezone": "UTC"}
        )
        assert "недоступен" in r2.json()["reply"]["message"]
    finally:
        settings.chat_enabled = True


def test_edge_secret_rejects_non_cloudflare():
    from app.config import settings

    settings.edge_secret = "s3cr3t"
    try:
        r = client.post("/api/chat", json={"message": "hi", "client_timezone": "UTC"})
        assert r.status_code == 403
        with booking_agent.override(model=_text_model("ok")):
            r2 = client.post(
                "/api/chat",
                json={"message": "hi", "client_timezone": "UTC"},
                headers={settings.edge_secret_header: "s3cr3t"},
            )
        assert r2.status_code == 200
    finally:
        settings.edge_secret = ""


def test_turnstile_required_when_configured():
    from app.config import settings

    settings.turnstile_secret = "ts-secret"
    try:
        r = client.post("/api/chat", json={"message": "hi", "client_timezone": "UTC"})
        assert r.status_code == 403  # no token supplied
    finally:
        settings.turnstile_secret = ""


def test_booking_kill_switch_blocks_booking():
    from app.config import settings

    settings.booking_enabled = False
    try:
        with booking_agent.override(model=FunctionModel(_book_then_speak())):
            r = client.post(
                "/api/chat",
                json={"message": "[widget] Confirmed", "client_timezone": "UTC"},
                headers={"cf-connecting-ip": "203.0.113.20"},
            )
        assert r.status_code == 200
        assert r.json()["reply"]["type"] != "booked"
    finally:
        settings.booking_enabled = True


def test_global_booking_cap():
    from app.limits import BookingLimiter

    lim = BookingLimiter(per_day=1, per_email=99)
    assert lim.check("a@b.co") is None
    lim.record("a@b.co")
    assert lim.check("c@d.co") == "GLOBAL_DAILY_LIMIT"


def test_per_email_booking_cap():
    from app.limits import BookingLimiter

    lim = BookingLimiter(per_day=99, per_email=1)
    assert lim.check("a@b.co") is None
    lim.record("a@b.co")
    assert lim.check("a@b.co") == "PER_EMAIL_LIMIT"
    assert lim.check("other@b.co") is None  # per-email, not global


def test_public_config():
    r = client.get("/api/config")
    assert r.status_code == 200
    data = r.json()
    assert data["title"]
    assert data["title_ru"]
    assert data["greeting_ru"]
    assert len(data["schedule"]) == 7
    assert data["slot_minutes"] in (15, 30, 45, 60)
    assert isinstance(data["buttons"], list)
    assert all("label_ru" in b for b in data["buttons"])


def test_client_locale_sets_start_language():
    seen = {}

    def capture(messages, info):
        seen["instructions"] = next(
            (m.instructions for m in messages if getattr(m, "instructions", None)),
            "",
        )
        return ModelResponse(parts=[TextPart("Привет!")])

    with booking_agent.override(model=FunctionModel(capture)):
        r = client.post(
            "/api/chat",
            json={
                "message": "hello",
                "client_timezone": "UTC",
                "client_locale": "ru-RU",
            },
        )
    assert r.status_code == 200
    assert "start the\nconversation in Russian" in seen["instructions"]

    with booking_agent.override(model=FunctionModel(capture)):
        client.post(
            "/api/chat",
            json={
                "message": "hello",
                "client_timezone": "UTC",
                "client_locale": "de-DE",
            },
        )
    assert "start the\nconversation in English" in seen["instructions"]


def test_admin_requires_auth():
    assert client.get("/admin/api/config").status_code == 401
    assert (
        client.get("/admin/api/config", auth=("admin", "wrong")).status_code == 401
    )

    # /admin redirects to the SPA admin route
    r = client.get("/admin", follow_redirects=False)
    assert r.status_code == 307
    assert r.headers["location"].endswith("/#admin")


def test_admin_config_roundtrip():
    auth = ("admin", "test-admin-pass")
    cfg = client.get("/admin/api/config", auth=auth).json()
    cfg["title"] = "Custom Agent"
    cfg["slot_minutes"] = 45
    cfg["schedule"][5]["on"] = True

    r = client.put("/admin/api/config", json=cfg, auth=auth)
    assert r.status_code == 200

    public = client.get("/api/config").json()
    assert public["title"] == "Custom Agent"
    assert public["slot_minutes"] == 45
    assert public["schedule"][5]["on"] is True

    bad = dict(cfg, slot_minutes=17)
    assert client.put("/admin/api/config", json=bad, auth=auth).status_code == 422


def test_spam_cleanup_endpoints():
    auth = ("admin", "test-admin-pass")
    # auth required
    assert client.get("/admin/api/spam-meetings").status_code == 401
    assert (
        client.post("/admin/api/spam-meetings/delete", json={"days": 30}).status_code
        == 401
    )

    # DEMO_MODE → no real calendar, so empty preview and nothing deleted
    r = client.get("/admin/api/spam-meetings?days=30", auth=auth)
    assert r.status_code == 200
    assert r.json() == {"count": 0, "events": []}

    d = client.post(
        "/admin/api/spam-meetings/delete", json={"event_ids": ["x", "y"]}, auth=auth
    )
    assert d.status_code == 200
    assert d.json() == {"deleted": 0}


def test_demo_mode_booking():
    start = datetime.now(timezone.utc) + timedelta(days=1)
    booking = create_meeting("visitor@example.com", start, 30, None)
    assert booking.meet_url.startswith("https://meet.google.com/")
    assert booking.end - booking.start == timedelta(minutes=30)
    assert booking.visitor_email == "visitor@example.com"
