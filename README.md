# Easy Study Mini App

Минимальный проект Telegram Mini App + Telegram bot для заявок на учебные работы. Архитектура взята по техническим паттернам из `D:\uchi-bot`, но продуктовая логика здесь новая и компактная: услуги, заявки, админка и отзывы.

## Стек

- Backend: FastAPI, SQLAlchemy async, Alembic, PostgreSQL
- Frontend: React, TypeScript, Vite, TailwindCSS, `@twa-dev/sdk`
- Telegram: авторизация Mini App через `initData`, webhook или polling, отправка сообщений через Bot API

В проекте нет OpenAI, экзаменов, предметных движков, рефералок, оплат, AI-логов и AI-кэшей.

## Структура

```text
backend/
  app/
    auth/              # Telegram initData auth and dev fallback
    routers/           # public, admin, orders, services, telegram
    services/          # Telegram Bot API and order notifications
    models.py          # User, Service, Order, Review
    schemas.py
    main.py
  alembic/
  tests/
frontend/
  src/
    pages/
    components/
    services/
```

## Backend env

Backend читает `.env` из папки `backend`.

```env
APP_NAME=Easy Study API
DATABASE_URL=postgresql+asyncpg://easy_study:easy_study@localhost:5432/easy_study
TELEGRAM_BOT_TOKEN=
TELEGRAM_MINI_APP_URL=http://localhost:5173
DEV_TELEGRAM_USER_ID=123456789
FRONTEND_ORIGIN=http://localhost:5173
FRONTEND_ORIGINS=
AUTO_CREATE_DB=false
MAX_REQUEST_BODY_BYTES=1048576
LOG_LEVEL=INFO
```

`DEV_TELEGRAM_USER_ID` разрешает локально открывать frontend вне Telegram. В production оставьте пустым.

## Frontend env

Frontend читает `.env` из папки `frontend`.

```env
VITE_API_URL=http://localhost:8000/api
```

Для production можно заменить `frontend/public/runtime-config.js` на деплое:

```js
window.__EASY_STUDY_CONFIG__ = {
  API_URL: 'https://api.example.com/api'
};
```

## Локальный запуск

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
docker compose up -d db
alembic upgrade head
python -m app.seed_data
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Mini App будет доступен на `http://localhost:5173`.

## Telegram bot

Webhook endpoint:

```text
POST https://your-api.example.com/api/telegram/webhook
```

Polling для dev:

```bash
cd backend
python -m app.run_telegram_polling
```

Команды:

- `/start` показывает приветствие и кнопку Mini App
- `/help` объясняет оформление заявки
- `/orders` открывает Mini App на странице заказов

При создании заказа backend отправляет всем пользователям с `is_admin=true` сообщение в Telegram. После перевода заказа в `done` пользователю отправляется кнопка для отзыва.

## Админ

Админом можно сделать существующего пользователя:

```bash
cd backend
python -m scripts.set_admin 123456789
```

Снять права:

```bash
python -m scripts.set_admin 123456789 --demote
```

Пользователь должен хотя бы один раз открыть Mini App или написать `/start`, чтобы запись появилась в базе.

## Тесты и сборка

Backend:

```bash
cd backend
pytest
```

Frontend:

```bash
cd frontend
npm run build
```

## Docker

Dev compose поднимает API и PostgreSQL:

```bash
cd backend
docker compose up --build
```

Production pattern:

```bash
cd backend
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Frontend можно деплоить как обычный Vite static build. Для Vercel добавлен `frontend/vercel.json` с SPA rewrite.

