from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Service


DEFAULT_SERVICES = [
    {
        "title": "Презентация",
        "description": "Структурированная презентация с понятными слайдами и визуальным оформлением.",
        "price_from": 700,
        "estimated_time": "от 1 дня",
    },
    {
        "title": "Доклад",
        "description": "Краткий текст выступления по теме с логичной структурой и выводами.",
        "price_from": 500,
        "estimated_time": "от 1 дня",
    },
    {
        "title": "Реферат",
        "description": "Учебная работа с планом, содержанием, источниками и оформлением.",
        "price_from": 1200,
        "estimated_time": "от 2 дней",
    },
    {
        "title": "Индивидуальный проект",
        "description": "Проектная работа с исследованием, целями, задачами и презентационными материалами.",
        "price_from": 2500,
        "estimated_time": "от 4 дней",
    },
    {
        "title": "Курсовая работа",
        "description": "Полноценная курсовая с теоретической и практической частью.",
        "price_from": 4500,
        "estimated_time": "от 7 дней",
    },
    {
        "title": "Дипломная работа",
        "description": "Выпускная квалификационная работа с глубокой проработкой темы.",
        "price_from": 12000,
        "estimated_time": "от 14 дней",
    },
    {
        "title": "Эссе",
        "description": "Авторский текст с аргументацией, примерами и аккуратной подачей мысли.",
        "price_from": 800,
        "estimated_time": "от 1 дня",
    },
    {
        "title": "Другое",
        "description": "Нестандартная учебная задача, которую администратор уточнит после заявки.",
        "price_from": 500,
        "estimated_time": "по договоренности",
    },
]


def seed_services(db: Session) -> None:
    existing_titles = set(db.scalars(select(Service.title)).all())
    for item in DEFAULT_SERVICES:
        if item["title"] not in existing_titles:
            db.add(Service(**item, is_active=True))
    db.commit()
