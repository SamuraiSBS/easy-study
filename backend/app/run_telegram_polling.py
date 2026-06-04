import asyncio
import logging

from app.database import async_session
from app.routers.telegram import process_telegram_update
from app.services.telegram_bot import TelegramBotError, telegram_bot

logging.basicConfig(level=logging.INFO, format="%(levelname)s [%(name)s] %(message)s")
logger = logging.getLogger(__name__)


async def run_polling() -> None:
    offset: int | None = None
    logger.info("Telegram polling started")
    while True:
        try:
            updates = await telegram_bot.get_updates(offset=offset)
            for update in updates:
                offset = int(update["update_id"]) + 1
                async with async_session() as db:
                    await process_telegram_update(update, db)
        except TelegramBotError:
            logger.exception("Telegram polling request failed")
            await asyncio.sleep(3)
        except Exception:
            logger.exception("Telegram polling loop failed")
            await asyncio.sleep(3)


if __name__ == "__main__":
    asyncio.run(run_polling())

