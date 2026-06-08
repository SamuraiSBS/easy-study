import asyncio

from sqlalchemy import select

from app.auth.telegram import build_dev_telegram_user
from app.config import settings
from app.database import async_session
from app.models import User


async def ensure_local_admin() -> None:
    if not settings.dev_telegram_user_id:
        raise SystemExit("DEV_TELEGRAM_USER_ID is required for local admin setup.")

    user_data = build_dev_telegram_user(settings.dev_telegram_user_id)
    telegram_id = str(user_data["id"])

    async with async_session() as db:
        result = await db.execute(select(User).where(User.telegram_id == telegram_id))
        user = result.scalar_one_or_none()

        if user is None:
            user = User(
                telegram_id=telegram_id,
                first_name=user_data.get("first_name"),
                username=user_data.get("username"),
                photo_url=user_data.get("photo_url"),
                is_admin=True,
            )
            db.add(user)
        else:
            user.first_name = user_data.get("first_name")
            user.username = user_data.get("username")
            user.photo_url = user_data.get("photo_url")
            user.is_admin = True

        await db.commit()
        print(f"Local admin ready: {telegram_id}")


def main() -> None:
    asyncio.run(ensure_local_admin())


if __name__ == "__main__":
    main()
