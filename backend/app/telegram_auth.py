import hashlib
import hmac
import json
from urllib.parse import parse_qsl

from fastapi import HTTPException, Request, status

from app.config import Settings, get_settings
from app.schemas import TelegramUser


def validate_telegram_init_data(init_data: str, bot_token: str) -> TelegramUser:
    parsed = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise ValueError("Missing Telegram hash")

    data_check_string = "\n".join(f"{key}={value}" for key, value in sorted(parsed.items()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(calculated_hash, received_hash):
        raise ValueError("Telegram initData signature is invalid")

    raw_user = parsed.get("user")
    if not raw_user:
        raise ValueError("Telegram user is missing")
    user_data = json.loads(raw_user)
    return TelegramUser(
        id=int(user_data["id"]),
        username=user_data.get("username"),
        first_name=user_data.get("first_name"),
        last_name=user_data.get("last_name"),
    )


def get_dev_user(settings: Settings) -> TelegramUser:
    return TelegramUser(
        id=settings.dev_telegram_id,
        username=settings.dev_username,
        first_name=settings.dev_first_name,
        last_name=settings.dev_last_name,
    )


async def get_telegram_user_from_request(request: Request) -> TelegramUser:
    settings = get_settings()
    init_data = request.headers.get("x-telegram-init-data", "")

    if init_data and settings.bot_token:
        try:
            return validate_telegram_init_data(init_data, settings.bot_token)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    if settings.allow_dev_auth:
        return get_dev_user(settings)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Telegram WebApp initData is required",
    )
