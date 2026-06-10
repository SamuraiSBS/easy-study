import asyncio

from sqlalchemy import select

from app.database import async_session
from app.models import Service

SEED_SERVICES = [
    {
        "title": "Презентация",
        "description": "Соберем слайды по вашей теме: структура, текст, оформление и короткие тезисы для выступления.",
        "price_from": 1200,
        "price_to": 3500,
        "category": "Школьные и студенческие работы",
        "order_num": 10,
    },
    {
        "title": "Доклад",
        "description": "Подготовим доклад по теме: текст, логика выступления, источники и план, по которому удобно рассказывать.",
        "price_from": 1500,
        "price_to": 4000,
        "category": "Школьные и студенческие работы",
        "order_num": 20,
    },
    {
        "title": "Индивидуальный проект",
        "description": "Поможем собрать проект: цель, задачи, теория, практическая часть и оформление по требованиям.",
        "price_from": 5000,
        "price_to": 15000,
        "category": "Проектные работы",
        "order_num": 30,
    },
    {
        "title": "Курсовая работа",
        "description": "Подготовим курсовую с планом, главами, источниками и оформлением под ваши методические требования.",
        "price_from": 8000,
        "price_to": 25000,
        "category": "Вузовские работы",
        "order_num": 40,
    },
    {
        "title": "Дипломная работа",
        "description": "Поможем с дипломом: согласуем структуру, подготовим главы, внесем правки и соберем материалы к защите.",
        "price_from": 20000,
        "price_to": 60000,
        "category": "Вузовские работы",
        "order_num": 50,
    },
    {
        "title": "Реферат",
        "description": "Сделаем реферат по требованиям: содержание, основной текст, источники и оформление.",
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
