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

Быстрый запуск для просмотра в браузере без Docker и PostgreSQL. Команды ниже рассчитаны на PowerShell и запускаются из корня проекта.

## Быстрый запуск для Codex

Если нужно просто запустить проект локально, не сканируйте весь репозиторий. Достаточно проверить этот раздел README и выполнить команды ниже.

Перед установкой или запуском проверьте уже готовые части:

```powershell
Test-Path backend\.venv
Test-Path frontend\node_modules
Get-Content frontend\public\runtime-config.js
curl.exe -s -o NUL -w "%{http_code}" http://localhost:8000/api/services
curl.exe -s -o NUL -w "%{http_code}" http://localhost:5173
```

- Если первые две команды возвращают `True`, зависимости уже стоят и переустанавливать их не нужно.
- Если `curl` возвращает `200`, соответствующий сервер уже запущен; не запускайте второй экземпляр на том же порту.
- `Get-NetTCPConnection` может падать с `Отказано в доступе`; для обычной проверки запуска достаточно `curl`.
- Backend можно запускать без Docker/PostgreSQL через временную SQLite-базу из команд ниже.
- При локальном `TELEGRAM_BOT_TOKEN=local-disabled` backend может писать `Telegram API error 404` при настройке меню. Это ожидаемо и не мешает Mini App в браузере.
- Если появляется `Python-dotenv could not parse statement starting at line 1`, но backend продолжает стартовать и `/api/services` отвечает `200`, для локального просмотра это не блокер.
- Если Vite падает с `Error: spawn EPERM`, запустите `npm run dev` вне sandbox/ограниченной среды. Это ошибка запуска `esbuild`, а не проблема кода приложения.

1. Если `backend/.venv` отсутствует, создать окружение и поставить зависимости:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
cd ..
```

2. Если `frontend/node_modules` отсутствует, поставить frontend-зависимости:

```powershell
cd frontend
npm install
cd ..
```

3. Убедиться, что `frontend/public/runtime-config.js` указывает на локальный API:

```js
window.__EASY_STUDY_CONFIG__ = {
  API_URL: 'http://localhost:8000/api'
};
```

4. Подготовить локальную SQLite-базу:

```powershell
cd backend
$db = Join-Path $env:TEMP 'easy_study_runtime.sqlite3'
$env:DATABASE_URL = 'sqlite+aiosqlite:///' + $db.Replace('\', '/')
$env:AUTO_CREATE_DB = 'true'
$env:DEV_TELEGRAM_USER_ID = '123456789'
$env:TELEGRAM_BOT_TOKEN = 'local-disabled'
$env:FRONTEND_ORIGIN = 'http://localhost:5173'
$env:FRONTEND_ORIGINS = 'http://localhost:5173'

.venv\Scripts\python.exe -c "import asyncio; import app.models; from app.database import create_db; asyncio.run(create_db())"
.venv\Scripts\python.exe -m app.seed_data
cd ..
```

5. Запустить backend и frontend:

```powershell
cd backend
$db = Join-Path $env:TEMP 'easy_study_runtime.sqlite3'
$env:DATABASE_URL = 'sqlite+aiosqlite:///' + $db.Replace('\', '/')
$env:AUTO_CREATE_DB = 'true'
$env:DEV_TELEGRAM_USER_ID = '123456789'
$env:TELEGRAM_BOT_TOKEN = 'local-disabled'
$env:FRONTEND_ORIGIN = 'http://localhost:5173'
$env:FRONTEND_ORIGINS = 'http://localhost:5173'
.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Во втором терминале:

```powershell
cd frontend
npm run dev
```

Проверка:

```powershell
curl.exe -s -i http://localhost:8000/api/services
curl.exe -s -i http://localhost:5173
```

Ожидаемые адреса: frontend `http://localhost:5173`, backend `http://localhost:8000/api`.

Примечания для агента:

- Не запускать Docker/PostgreSQL для обычного локального просмотра.
- Не читать все файлы проекта, если задача только "запусти проект локально".
- Не запускать тесты и сборку без отдельной просьбы.
- Сначала проверить `backend/.venv`, `frontend/node_modules`, `runtime-config.js` и HTTP-ответы через `curl`, чтобы не делать лишнюю установку и не поднимать дубликаты процессов.
- Ошибку Telegram Bot API при `TELEGRAM_BOT_TOKEN=local-disabled` можно игнорировать.
- Предупреждение `Python-dotenv could not parse statement starting at line 1` не мешает локальному запуску, если нужные env-переменные заданы в текущей PowerShell-сессии.
- Если Vite падает с `spawn EPERM`, перезапустить `npm run dev` вне sandbox.
- Если `python -m venv .venv` падает на `ensurepip` из-за доступа к `C:\Temp`, повторить команду вне sandbox.

Первый раз установите зависимости:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

cd ..\frontend
npm install
```

Backend, терминал 1:

```powershell
cd backend
.venv\Scripts\activate

$db = Join-Path $env:TEMP 'easy_study_runtime.sqlite3'
$env:DATABASE_URL = 'sqlite+aiosqlite:///' + $db.Replace('\', '/')
$env:AUTO_CREATE_DB = 'true'
$env:DEV_TELEGRAM_USER_ID = '123456789'
$env:TELEGRAM_BOT_TOKEN = 'local-disabled'
$env:FRONTEND_ORIGIN = 'http://localhost:5173'
$env:FRONTEND_ORIGINS = 'http://localhost:5173'

python -c "import asyncio; import app.models; from app.database import create_db; asyncio.run(create_db())"
python -m app.seed_data
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

`TELEGRAM_BOT_TOKEN=local-disabled` нужен, чтобы локальный запуск не использовал реальный токен из `.env`. Ошибку Telegram Bot API при старте можно игнорировать: на работу Mini App в браузере она не влияет.

Frontend, терминал 2:

```powershell
cd frontend
npm run dev
```

Mini App будет доступен на `http://localhost:5173`.

Для локального API файл `frontend/public/runtime-config.js` должен указывать на:

```js
window.__EASY_STUDY_CONFIG__ = {
  API_URL: 'http://localhost:8000/api'
};
```

Для production верните в этом файле production URL.

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
