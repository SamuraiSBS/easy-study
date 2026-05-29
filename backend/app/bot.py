import asyncio
from dataclasses import dataclass

from aiogram import Bot, Dispatcher, F, Router
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
    WebAppInfo,
)

from app import crud
from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.models import OrderStatus, Service
from app.notifications import STATUS_TITLES, format_order_message, order_status_keyboard
from app.schemas import OrderCreate, ReviewCreate, TelegramUser
from app.services_seed import seed_services


class OrderFlow(StatesGroup):
    service_id = State()
    deadline = State()
    topic = State()
    comment = State()
    confirm = State()


class ReviewFlow(StatesGroup):
    order_id = State()
    rating = State()
    text = State()


@dataclass(frozen=True)
class Menu:
    order: str = "Оформить заказ"
    prices: str = "Цены"
    my_orders: str = "Мои заказы"
    review: str = "Оставить отзыв"
    mini_app: str = "Открыть Mini App"


menu = Menu()
router = Router()
settings = get_settings()


def main_keyboard() -> ReplyKeyboardMarkup:
    buttons = [
        [KeyboardButton(text=menu.order), KeyboardButton(text=menu.prices)],
        [KeyboardButton(text=menu.my_orders), KeyboardButton(text=menu.review)],
    ]
    if settings.mini_app_url:
        buttons.append([KeyboardButton(text=menu.mini_app, web_app=WebAppInfo(url=settings.mini_app_url))])
    return ReplyKeyboardMarkup(keyboard=buttons, resize_keyboard=True)


def services_keyboard() -> InlineKeyboardMarkup:
    with SessionLocal() as db:
        services = crud.list_active_services(db)
    rows = [
        [InlineKeyboardButton(text=f"{service.title} - от {service.price_from} ₽", callback_data=f"service:{service.id}")]
        for service in services
    ]
    rows.append([InlineKeyboardButton(text="Отмена", callback_data="cancel")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def confirm_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Подтвердить заявку", callback_data="confirm_order")],
            [InlineKeyboardButton(text="Отмена", callback_data="cancel")],
        ]
    )


def review_rating_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=str(rating), callback_data=f"rating:{rating}") for rating in range(1, 6)],
            [InlineKeyboardButton(text="Отмена", callback_data="cancel")],
        ]
    )


def telegram_user_from_message(message: Message) -> TelegramUser:
    user = message.from_user
    return TelegramUser(
        id=user.id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
    )


def ensure_user(message: Message):
    with SessionLocal() as db:
        return crud.upsert_user(db, telegram_user_from_message(message))


async def send_admin_order(bot: Bot, order_id: int) -> None:
    if not settings.admin_telegram_id:
        return
    with SessionLocal() as db:
        order = crud.get_order(db, order_id)
        text = format_order_message(order)
    await bot.send_message(
        chat_id=settings.admin_telegram_id,
        text=text,
        reply_markup=order_status_keyboard(order_id),
    )


@router.message(CommandStart())
async def start(message: Message, state: FSMContext) -> None:
    await state.clear()
    ensure_user(message)
    await message.answer(
        "Привет! Здесь можно быстро оформить заявку на учебную работу, посмотреть цены и оставить отзыв.",
        reply_markup=main_keyboard(),
    )


@router.message(Command("orders"))
async def admin_new_orders(message: Message) -> None:
    if settings.admin_telegram_id != message.from_user.id:
        return
    with SessionLocal() as db:
        orders = crud.list_orders(db, OrderStatus.NEW)
    if not orders:
        await message.answer("Новых заказов нет.")
        return
    for order in orders[:20]:
        await message.answer(format_order_message(order), reply_markup=order_status_keyboard(order.id))


@router.message(F.text == menu.prices)
async def prices(message: Message) -> None:
    with SessionLocal() as db:
        services = crud.list_active_services(db)
    lines = ["<b>Цены</b>"]
    for service in services:
        lines.append(f"\n<b>{service.title}</b>\nот {service.price_from} ₽, срок {service.estimated_time}")
    await message.answer("\n".join(lines))


@router.message(F.text == menu.my_orders)
async def my_orders(message: Message) -> None:
    user = ensure_user(message)
    with SessionLocal() as db:
        orders = crud.list_user_orders(db, user)
    if not orders:
        await message.answer("У вас пока нет заказов.")
        return
    lines = ["<b>Мои заказы</b>"]
    for order in orders[:10]:
        lines.append(
            f"\n#{order.id} - {order.service.title}\n"
            f"{order.topic}\n"
            f"Срок: {order.deadline}\n"
            f"Статус: {STATUS_TITLES[order.status]}"
        )
    await message.answer("\n".join(lines))


@router.message(F.text == menu.order)
async def order_start(message: Message, state: FSMContext) -> None:
    ensure_user(message)
    await state.set_state(OrderFlow.service_id)
    await message.answer("Выберите услугу:", reply_markup=services_keyboard())


@router.callback_query(OrderFlow.service_id, F.data.startswith("service:"))
async def order_service(callback: CallbackQuery, state: FSMContext) -> None:
    await state.update_data(service_id=int(callback.data.split(":")[1]))
    await state.set_state(OrderFlow.deadline)
    await callback.message.edit_text("Укажите срок выполнения. Например: завтра, 3 дня, до 15 июня.")
    await callback.answer()


@router.message(OrderFlow.deadline)
async def order_deadline(message: Message, state: FSMContext) -> None:
    await state.update_data(deadline=message.text.strip())
    await state.set_state(OrderFlow.topic)
    await message.answer("Введите тему или краткое описание работы.")


@router.message(OrderFlow.topic)
async def order_topic(message: Message, state: FSMContext) -> None:
    await state.update_data(topic=message.text.strip())
    await state.set_state(OrderFlow.comment)
    await message.answer("Добавьте комментарий: требования, объем, формат. Если комментариев нет, напишите «нет».")


@router.message(OrderFlow.comment)
async def order_comment(message: Message, state: FSMContext) -> None:
    comment = message.text.strip()
    data = await state.get_data()
    with SessionLocal() as db:
        service = db.get(Service, data["service_id"])
    await state.update_data(comment=None if comment.lower() in {"нет", "no", "-"} else comment)
    await state.set_state(OrderFlow.confirm)
    service_title = service.title if service else f"#{data['service_id']}"
    await message.answer(
        "<b>Проверьте заявку</b>\n\n"
        f"<b>Услуга:</b> {service_title}\n"
        f"<b>Срок:</b> {data['deadline']}\n"
        f"<b>Тема:</b> {data['topic']}\n"
        f"<b>Комментарий:</b> {comment}",
        reply_markup=confirm_keyboard(),
    )


@router.callback_query(OrderFlow.confirm, F.data == "confirm_order")
async def order_confirm(callback: CallbackQuery, state: FSMContext, bot: Bot) -> None:
    data = await state.get_data()
    user = TelegramUser(
        id=callback.from_user.id,
        username=callback.from_user.username,
        first_name=callback.from_user.first_name,
        last_name=callback.from_user.last_name,
    )
    with SessionLocal() as db:
        db_user = crud.upsert_user(db, user)
        order = crud.create_order(
            db,
            db_user,
            OrderCreate(
                service_id=data["service_id"],
                topic=data["topic"],
                subject=None,
                deadline=data["deadline"],
                comment=data.get("comment"),
            ),
        )
        order_id = order.id
    await state.clear()
    await callback.message.edit_text("Заявка принята. Администратор скоро свяжется с вами в Telegram.")
    await send_admin_order(bot, order_id)
    await callback.answer()


@router.message(F.text == menu.review)
async def review_start(message: Message, state: FSMContext) -> None:
    ensure_user(message)
    await state.set_state(ReviewFlow.order_id)
    await message.answer("Введите ID заказа или напишите «нет», если хотите оставить общий отзыв.")


@router.message(ReviewFlow.order_id)
async def review_order_id(message: Message, state: FSMContext) -> None:
    text = message.text.strip()
    order_id = None if text.lower() in {"нет", "no", "-"} else int(text)
    await state.update_data(order_id=order_id)
    await state.set_state(ReviewFlow.rating)
    await message.answer("Поставьте оценку от 1 до 5:", reply_markup=review_rating_keyboard())


@router.callback_query(ReviewFlow.rating, F.data.startswith("rating:"))
async def review_rating(callback: CallbackQuery, state: FSMContext) -> None:
    await state.update_data(rating=int(callback.data.split(":")[1]))
    await state.set_state(ReviewFlow.text)
    await callback.message.edit_text("Напишите текст отзыва.")
    await callback.answer()


@router.message(ReviewFlow.text)
async def review_text(message: Message, state: FSMContext) -> None:
    data = await state.get_data()
    try:
        with SessionLocal() as db:
            db_user = crud.upsert_user(db, telegram_user_from_message(message))
            crud.create_review(
                db,
                db_user,
                ReviewCreate(order_id=data.get("order_id"), rating=data["rating"], text=message.text.strip()),
            )
    except ValueError:
        await message.answer("Не получилось найти этот заказ. Проверьте ID и попробуйте еще раз.")
        return
    await state.clear()
    await message.answer("Спасибо! Отзыв отправлен на модерацию.", reply_markup=main_keyboard())


@router.callback_query(F.data == "cancel")
async def cancel(callback: CallbackQuery, state: FSMContext) -> None:
    await state.clear()
    await callback.message.edit_text("Действие отменено.")
    await callback.answer()


@router.callback_query(F.data.startswith("status:"))
async def admin_status(callback: CallbackQuery) -> None:
    if settings.admin_telegram_id != callback.from_user.id:
        await callback.answer("Недоступно", show_alert=True)
        return
    _, order_id_raw, status_raw = callback.data.split(":")
    with SessionLocal() as db:
        order = crud.update_order_status(db, int(order_id_raw), OrderStatus(status_raw))
        text = format_order_message(order)
    await callback.message.edit_text(text, reply_markup=order_status_keyboard(order.id))
    await callback.answer(f"Статус: {STATUS_TITLES[order.status]}")


async def main() -> None:
    if not settings.bot_token:
        raise RuntimeError("BOT_TOKEN is required")
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_services(db)

    bot = Bot(settings.bot_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = Dispatcher(storage=MemoryStorage())
    dp.include_router(router)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
