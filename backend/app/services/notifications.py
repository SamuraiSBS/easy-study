import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.models import Order, User
from app.services.telegram_bot import TelegramBotError, telegram_bot

logger = logging.getLogger(__name__)


def mini_app_url(path: str = "") -> str:
    base_url = (settings.telegram_mini_app_url or settings.frontend_origin).rstrip("/")
    if not path:
        return base_url
    return f"{base_url}/{path.lstrip('/')}"


def user_label(user: User) -> str:
    username = f"@{user.username}" if user.username else ""
    name = user.first_name or "Пользователь"
    return f"{name} {username}".strip()


def price_label(price_from: int, price_to: int | None) -> str:
    if price_to is not None and price_to != price_from:
        return f"от {price_from} до {price_to} ₽"
    return f"от {price_from} ₽"


async def notify_admins_about_new_order(db: AsyncSession, order_id: int) -> int:
    if not settings.telegram_bot_token:
        return 0

    order_result = await db.execute(
        select(Order).options(selectinload(Order.user)).where(Order.id == order_id)
    )
    order = order_result.scalar_one_or_none()
    if order is None:
        return 0

    admins_result = await db.execute(select(User).where(User.is_admin.is_(True)))
    admins = admins_result.scalars().all()
    if not admins:
        return 0

    text = (
        f"Новая заявка #{order.id}\n\n"
        f"Услуга: {order.title_snapshot}\n"
        f"Цена: {price_label(order.price_from_snapshot, order.price_to_snapshot)}\n"
        f"Клиент: {user_label(order.user)}\n"
        f"Telegram ID: {order.user.telegram_id}\n\n"
        f"Комментарий:\n{order.customer_comment or 'Без комментария'}"
    )
    reply_markup = {
        "inline_keyboard": [
            [{"text": "Открыть заказ", "web_app": {"url": mini_app_url(f"/admin/orders/{order.id}")}}]
        ]
    }

    sent = 0
    for admin in admins:
        try:
            await telegram_bot.send_message(admin.telegram_id, text, reply_markup=reply_markup)
            sent += 1
        except TelegramBotError:
            logger.exception("Failed to notify admin %s about order %s", admin.telegram_id, order.id)
    return sent


async def notify_user_review_request(db: AsyncSession, order_id: int) -> bool:
    if not settings.telegram_bot_token:
        return False

    result = await db.execute(select(Order).options(selectinload(Order.user)).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if order is None:
        return False

    reply_markup = {
        "inline_keyboard": [
            [{"text": "Оставить отзыв", "web_app": {"url": mini_app_url(f"/orders/{order.id}/review")}}]
        ]
    }
    try:
        await telegram_bot.send_message(
            order.user.telegram_id,
            f"Заказ #{order.id} завершён. Будем благодарны за короткий отзыв.",
            reply_markup=reply_markup,
        )
    except TelegramBotError:
        logger.exception("Failed to send review request for order %s", order.id)
        return False
    return True

