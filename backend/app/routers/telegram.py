import logging
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models import User
from app.services.notifications import mini_app_url
from app.services.telegram_bot import TelegramBotError, telegram_bot

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/telegram", tags=["telegram"])

START_TEXT = (
    "Привет! Здесь можно заказать учебную работу: презентацию, доклад, проект, курсовую, диплом или реферат."
)
HELP_TEXT = (
    "Открой Mini App, выбери услугу, укажи комментарий и отправь заявку. "
    "Администратор увидит заказ и свяжется с тобой в Telegram."
)
ORDERS_TEXT = "Открой список своих заявок в Mini App."


def app_keyboard(path: str = "") -> dict:
    return {"inline_keyboard": [[{"text": "Открыть Mini App", "web_app": {"url": mini_app_url(path)}}]]}


async def upsert_telegram_user(db: AsyncSession, telegram_user: dict) -> User | None:
    if not telegram_user.get("id"):
        return None

    telegram_id = str(telegram_user["id"])
    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(
            telegram_id=telegram_id,
            first_name=telegram_user.get("first_name"),
            username=telegram_user.get("username"),
            photo_url=telegram_user.get("photo_url"),
            created_at=datetime.now(timezone.utc),
        )
        db.add(user)
    else:
        user.first_name = telegram_user.get("first_name")
        user.username = telegram_user.get("username")
        user.photo_url = telegram_user.get("photo_url")
    await db.commit()
    await db.refresh(user)
    return user


async def process_telegram_update(update: dict, db: AsyncSession) -> dict:
    message = update.get("message") or {}
    text = (message.get("text") or "").strip()
    chat = message.get("chat") or {}
    telegram_user = message.get("from") or {}
    chat_id = str(chat["id"]) if chat.get("id") else ""

    if text.startswith("/start"):
        if chat_id:
            await upsert_telegram_user(db, telegram_user)
            await telegram_bot.send_message(chat_id, START_TEXT, reply_markup=app_keyboard())
        return {"ok": True}

    if text.startswith("/help"):
        if chat_id:
            await telegram_bot.send_message(chat_id, HELP_TEXT, reply_markup=app_keyboard())
        return {"ok": True}

    if text.startswith("/orders"):
        if chat_id:
            await upsert_telegram_user(db, telegram_user)
            await telegram_bot.send_message(chat_id, ORDERS_TEXT, reply_markup=app_keyboard("/orders"))
        return {"ok": True}

    return {"ok": True}


async def process_telegram_update_background(update: dict) -> None:
    try:
        async with async_session() as db:
            await process_telegram_update(update, db)
    except TelegramBotError:
        logger.exception("Telegram bot API failed while processing update %s", update.get("update_id"))
    except Exception:
        logger.exception("Failed to process Telegram update %s", update.get("update_id"))


@router.post("/webhook")
async def handle_telegram_update(update: dict, background_tasks: BackgroundTasks):
    background_tasks.add_task(process_telegram_update_background, update)
    return {"ok": True}
