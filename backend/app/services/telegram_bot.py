import asyncio
import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

TELEGRAM_BOT_COMMANDS = [
    {"command": "start", "description": "Открыть приложение"},
    {"command": "help", "description": "Как оставить заявку"},
    {"command": "orders", "description": "Мои заявки"},
]


class TelegramBotError(Exception):
    pass


class TelegramBotClient:
    def __init__(self, token: str) -> None:
        self.token = token
        self._client: httpx.AsyncClient | None = None
        self._client_lock = asyncio.Lock()

    async def aclose(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    async def send_message(
        self,
        chat_id: str,
        text: str,
        reply_markup: dict | None = None,
    ) -> dict:
        if not self.token:
            raise TelegramBotError("Telegram bot token is not configured")

        payload: dict = {"chat_id": chat_id, "text": text}
        if reply_markup:
            payload["reply_markup"] = reply_markup

        return await self._post_json("sendMessage", payload)

    async def get_updates(self, offset: int | None = None, timeout: int | None = None) -> list[dict]:
        payload: dict = {
            "timeout": timeout or settings.telegram_polling_timeout_seconds,
            "allowed_updates": ["message", "callback_query"],
        }
        if offset is not None:
            payload["offset"] = offset
        data = await self._post_json("getUpdates", payload)
        return data.get("result", [])

    async def set_my_commands(self) -> dict:
        return await self._post_json("setMyCommands", {"commands": TELEGRAM_BOT_COMMANDS})

    async def set_web_app_menu_button(self, text: str, web_app_url: str) -> dict:
        return await self._post_json(
            "setChatMenuButton",
            {
                "menu_button": {
                    "type": "web_app",
                    "text": text,
                    "web_app": {"url": web_app_url},
                }
            },
        )

    async def configure_bot_menu(self, web_app_url: str) -> None:
        if not self.token or not web_app_url:
            return
        await self.set_my_commands()
        await self.set_web_app_menu_button("Easy Study", web_app_url)

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is not None and not self._client.is_closed:
            return self._client
        async with self._client_lock:
            if self._client is None or self._client.is_closed:
                self._client = httpx.AsyncClient(
                    timeout=httpx.Timeout(connect=3, read=15, write=5, pool=5),
                    limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
                    trust_env=False,
                )
        return self._client

    async def _post_json(self, method: str, payload: dict) -> dict:
        if not self.token:
            raise TelegramBotError("Telegram bot token is not configured")

        client = await self._get_client()
        try:
            response = await client.post(f"https://api.telegram.org/bot{self.token}/{method}", json=payload)
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text
            logger.warning("Telegram API error %s for %s: %s", exc.response.status_code, method, detail)
            raise TelegramBotError(f"Telegram API error {exc.response.status_code}: {detail}") from exc
        except httpx.RequestError as exc:
            logger.warning("Telegram API request failed for %s: %s", method, exc)
            raise TelegramBotError(f"Telegram API request failed: {exc}") from exc

        if not data.get("ok"):
            description = data.get("description", "Unknown Telegram API error")
            logger.warning("Telegram API returned error for %s: %s", method, description)
            raise TelegramBotError(description)

        return data


telegram_bot = TelegramBotClient(settings.telegram_bot_token)
