import hashlib
import hmac
import json
import sys
from pathlib import Path
from urllib.parse import urlencode

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import settings  # noqa: E402
from app.database import Base, get_session  # noqa: E402
from app.main import app  # noqa: E402

TEST_BOT_TOKEN = "test-bot-token"


def make_telegram_auth(user_id: str, first_name: str = "Test") -> str:
    payload = {
        "auth_date": "1710000000",
        "user": json.dumps(
            {"id": int(user_id), "first_name": first_name, "username": f"user_{user_id}"},
            separators=(",", ":"),
        ),
    }
    data_check_string = "\n".join(f"{key}={value}" for key, value in sorted(payload.items()))
    secret_key = hmac.new(b"WebAppData", TEST_BOT_TOKEN.encode(), hashlib.sha256).digest()
    payload["hash"] = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    return f"Telegram {urlencode(payload)}"


@pytest.fixture
async def session_factory():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        yield factory
    finally:
        await engine.dispose()


@pytest.fixture
async def client(monkeypatch, session_factory):
    monkeypatch.setattr(settings, "telegram_bot_token", TEST_BOT_TOKEN)
    monkeypatch.setattr(settings, "dev_telegram_user_id", "")
    monkeypatch.setattr(settings, "telegram_mini_app_url", "http://localhost:5173")
    monkeypatch.setattr(settings, "frontend_origin", "http://localhost:5173")

    async def override_get_session():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"Authorization": make_telegram_auth("1001")},
    ) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def auth_header():
    def _make(user_id: str) -> dict[str, str]:
        return {"Authorization": make_telegram_auth(user_id)}

    return _make

