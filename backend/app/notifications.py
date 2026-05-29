from html import escape

from aiogram import Bot
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from app.config import get_settings
from app.models import Order, OrderStatus, Review


STATUS_TITLES = {
    OrderStatus.NEW: "Новый",
    OrderStatus.IN_PROGRESS: "В работе",
    OrderStatus.COMPLETED: "Завершен",
    OrderStatus.CANCELLED: "Отменен",
}


def format_order_message(order: Order) -> str:
    user = order.user
    username = f"@{user.username}" if user.username else "не указан"
    full_name = " ".join(part for part in [user.first_name, user.last_name] if part) or "Без имени"
    created = order.created_at.strftime("%d.%m.%Y %H:%M") if order.created_at else "-"
    subject = order.subject or "-"
    comment = order.comment or "-"
    return (
        f"<b>Новая заявка #{order.id}</b>\n\n"
        f"<b>Пользователь:</b> {escape(full_name)}\n"
        f"<b>Telegram ID:</b> <code>{user.telegram_id}</code>\n"
        f"<b>Username:</b> {escape(username)}\n\n"
        f"<b>Услуга:</b> {escape(order.service.title)}\n"
        f"<b>Тема:</b> {escape(order.topic)}\n"
        f"<b>Предмет:</b> {escape(subject)}\n"
        f"<b>Срок:</b> {escape(order.deadline)}\n"
        f"<b>Комментарий:</b> {escape(comment)}\n"
        f"<b>Статус:</b> {STATUS_TITLES[order.status]}\n"
        f"<b>Создан:</b> {created}"
    )


def order_status_keyboard(order_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="В работе", callback_data=f"status:{order_id}:in_progress"),
                InlineKeyboardButton(text="Завершен", callback_data=f"status:{order_id}:completed"),
            ],
            [InlineKeyboardButton(text="Отменен", callback_data=f"status:{order_id}:cancelled")],
        ]
    )


async def notify_admin_order(order: Order) -> None:
    settings = get_settings()
    if not settings.bot_token or not settings.admin_telegram_id:
        return

    bot = Bot(settings.bot_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    try:
        await bot.send_message(
            chat_id=settings.admin_telegram_id,
            text=format_order_message(order),
            reply_markup=order_status_keyboard(order.id),
        )
    finally:
        await bot.session.close()


async def notify_admin_review(review: Review) -> None:
    settings = get_settings()
    if not settings.bot_token or not settings.admin_telegram_id:
        return

    bot = Bot(settings.bot_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    user = review.user
    username = f"@{user.username}" if user.username else "не указан"
    text = (
        f"<b>Новый отзыв #{review.id}</b>\n\n"
        f"<b>Оценка:</b> {review.rating}/5\n"
        f"<b>Заказ:</b> {review.order_id or '-'}\n"
        f"<b>Пользователь:</b> {escape(username)}\n"
        f"<b>Текст:</b> {escape(review.text)}"
    )
    try:
        await bot.send_message(chat_id=settings.admin_telegram_id, text=text)
    finally:
        await bot.session.close()
