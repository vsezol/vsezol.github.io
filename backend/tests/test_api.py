import os

os.environ["DEMO_MODE"] = "true"
os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from pydantic_ai.messages import ModelResponse, TextPart, ToolCallPart
from pydantic_ai.models.function import FunctionModel


def _text_model(text: str) -> FunctionModel:
    return FunctionModel(lambda messages, info: ModelResponse(parts=[TextPart(text)]))

from app.agent import AgentDeps, AskDateTime, AskEmail
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


def test_booking_flow_via_tool_call():
    start = (datetime.now(timezone.utc) + timedelta(days=2)).replace(microsecond=0)
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


def test_demo_mode_booking():
    start = datetime.now(timezone.utc) + timedelta(days=1)
    booking = create_meeting("visitor@example.com", start, 30, None)
    assert booking.meet_url.startswith("https://meet.google.com/")
    assert booking.end - booking.start == timedelta(minutes=30)
    assert booking.visitor_email == "visitor@example.com"
