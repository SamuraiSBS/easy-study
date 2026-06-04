import argparse
import asyncio

from sqlalchemy import select

from app.database import async_session
from app.models import User


async def set_admin(telegram_id: str, demote: bool) -> None:
    async with async_session() as db:
        result = await db.execute(select(User).where(User.telegram_id == telegram_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise SystemExit("User not found. Open the Mini App once before assigning admin rights.")
        user.is_admin = not demote
        await db.commit()
        action = "removed from admins" if demote else "promoted to admin"
        print(f"User {telegram_id} {action}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("telegram_id")
    parser.add_argument("--demote", action="store_true")
    args = parser.parse_args()
    asyncio.run(set_admin(args.telegram_id, args.demote))


if __name__ == "__main__":
    main()

