import asyncio

from sqlalchemy import select

from app.database import async_session
from app.models import Service

SEED_SERVICES = [
    {
        "title": "Презентация",
        "description": "Слайды с аккуратной структурой, визуальным оформлением и тезисами для защиты.",
        "price_from": 1200,
        "price_to": 3500,
        "category": "Школьные и студенческие работы",
        "order_num": 10,
    },
    {
        "title": "Доклад",
        "description": "Текст доклада по теме с понятной логикой, источниками и кратким планом выступления.",
        "price_from": 1500,
        "price_to": 4000,
        "category": "Школьные и студенческие работы",
        "order_num": 20,
    },
    {
        "title": "Индивидуальный проект",
        "description": "Проектная работа с целью, задачами, теорией, практической частью и оформлением.",
        "price_from": 5000,
        "price_to": 15000,
        "category": "Проектные работы",
        "order_num": 30,
    },
    {
        "title": "Курсовая работа",
        "description": "Курсовая с планом, теоретической и практической частью, списком источников и оформлением.",
        "price_from": 8000,
        "price_to": 25000,
        "category": "Вузовские работы",
        "order_num": 40,
    },
    {
        "title": "Дипломная работа",
        "description": "Дипломная работа с согласованием структуры, главами, правками и подготовкой к защите.",
        "price_from": 20000,
        "price_to": 60000,
        "category": "Вузовские работы",
        "order_num": 50,
    },
    {
        "title": "Реферат",
        "description": "Реферат по требованиям учебного заведения: содержание, текст, источники и оформление.",
        "price_from": 1500,
        "price_to": 5000,
        "category": "Школьные и студенческие работы",
        "order_num": 60,
    },
]


async def seed_services() -> None:
    async with async_session() as db:
        for item in SEED_SERVICES:
            result = await db.execute(select(Service).where(Service.title == item["title"]))
            service = result.scalar_one_or_none()
            if service is None:
                db.add(Service(**item, is_active=True))
                continue
            for key, value in item.items():
                setattr(service, key, value)
            service.is_active = True
        await db.commit()


if __name__ == "__main__":
    asyncio.run(seed_services())

