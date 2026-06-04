from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.telegram import (
    TelegramInitDataError,
    build_dev_telegram_user,
    parse_telegram_init_data,
)
from app.config import settings
from app.database import get_session
from app.models import User


async def get_current_user(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_session),
) -> User:
    user_data: dict | None = None

    if authorization and authorization.startswith("Telegram "):
        init_data = authorization.removeprefix("Telegram ").strip()
        try:
            user_data = parse_telegram_init_data(init_data, settings.telegram_bot_token)
        except TelegramInitDataError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    elif settings.dev_telegram_user_id:
        user_data = build_dev_telegram_user(settings.dev_telegram_user_id)

    if user_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Telegram authorization is required",
        )

    telegram_id = str(user_data["id"])
    result = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            telegram_id=telegram_id,
            first_name=user_data.get("first_name"),
            username=user_data.get("username"),
            photo_url=user_data.get("photo_url"),
        )
        db.add(user)
        try:
            await db.flush()
        except IntegrityError:
            await db.rollback()
            result = await db.execute(select(User).where(User.telegram_id == telegram_id))
            user = result.scalar_one()
    user.first_name = user_data.get("first_name")
    user.username = user_data.get("username")
    user.photo_url = user_data.get("photo_url")

    await db.commit()
    await db.refresh(user)
    return user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access is required")
    return current_user
