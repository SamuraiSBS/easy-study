import hashlib
import hmac
import json
from urllib.parse import parse_qsl


class TelegramInitDataError(ValueError):
    pass


def parse_telegram_init_data(init_data: str, bot_token: str) -> dict:
    if not bot_token:
        raise TelegramInitDataError("Telegram bot token is not configured")
    if not init_data:
        raise TelegramInitDataError("Telegram initData is required")

    pairs = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = pairs.pop("hash", None)
    if not received_hash:
        raise TelegramInitDataError("Telegram initData hash is missing")

    data_check_string = "\n".join(f"{key}={value}" for key, value in sorted(pairs.items()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    expected_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_hash, received_hash):
        raise TelegramInitDataError("Telegram initData signature is invalid")

    user_raw = pairs.get("user")
    if not user_raw:
        raise TelegramInitDataError("Telegram user payload is missing")

    try:
        user = json.loads(user_raw)
    except json.JSONDecodeError as exc:
        raise TelegramInitDataError("Telegram user payload is invalid") from exc

    if not user.get("id"):
        raise TelegramInitDataError("Telegram user id is missing")

    return user


def build_dev_telegram_user(telegram_id: str) -> dict:
    return {
        "id": telegram_id,
        "first_name": "Dev",
        "username": "dev_user",
        "photo_url": None,
    }

