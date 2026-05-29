# Easy Study MVP

Telegram Bot + Telegram Mini App для приема заявок на учебные работы. В MVP нет онлайн-оплаты: пользователь оформляет заявку, администратор получает уведомление в Telegram и связывается с пользователем вручную.

## Возможности

- Telegram-бот с `/start`, меню, ценами, заказами, отзывами и пошаговым оформлением заявки.
- Telegram Mini App на React: главная, каталог услуг, форма заказа, мои заказы, отзывы.
- Backend API на FastAPI.
- Хранение пользователей, услуг, заказов и отзывов в SQLite.
- Проверка подлинности Telegram Mini App `initData`.
- Уведомления админу через Telegram-бота.
- Управление статусами заказов через inline-кнопки у администратора.
- Alembic-миграция для начальной схемы.

## Структура

```text
.
├── backend/
│   ├── alembic/
│   │   └── versions/0001_initial.py
│   ├── app/
│   │   ├── bot.py
│   │   ├── config.py
│   │   ├── crud.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── notifications.py
│   │   ├── run_telegram_polling.py
│   │   ├── schemas.py
│   │   ├── services_seed.py
│   │   └── telegram_auth.py
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   ├── styles.css
│   │   └── telegram.ts
│   ├── package.json
│   └── vite.config.ts
├── alembic.ini
├── pyproject.toml
└── .env.example
```

## Быстрый запуск локально

1. Скопируйте переменные окружения:

```bash
cp .env.example .env
```

2. Установите backend-зависимости:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -e .
```

3. Запустите API:

```bash
uvicorn app.main:app --reload --app-dir backend
```

API будет доступен на `http://localhost:8000`. При первом запуске SQLite-база `easy_study.db` создастся автоматически, услуги будут добавлены сидом.

4. Установите frontend-зависимости и запустите Mini App:

```bash
cd frontend
npm install
npm run dev
```

Mini App будет доступен на `http://localhost:5173`.

5. В отдельном терминале запустите Telegram-бота:

```bash
.venv\Scripts\activate
python -m app.run_telegram_polling
```

Команду нужно запускать из корня проекта с `PYTHONPATH=backend`, либо так:

```bash
$env:PYTHONPATH="backend"
python -m app.run_telegram_polling
```

## Переменные окружения

Создайте `.env` на основе `.env.example`.

- `BOT_TOKEN` — токен бота из BotFather.
- `ADMIN_TELEGRAM_ID` — Telegram ID администратора, которому приходят заявки.
- `MINI_APP_URL` — публичный HTTPS-адрес Mini App для кнопки в боте.
- `DATABASE_URL` — строка подключения, для MVP по умолчанию `sqlite:///./easy_study.db`.
- `ADMIN_API_TOKEN` — токен для защищенных admin API endpoints.
- `ALLOW_DEV_AUTH` — `true` для локальной разработки без Telegram initData, `false` в продакшене.
- `VITE_API_URL` — адрес backend API для frontend.

## Как получить Telegram Bot Token

1. Откройте `@BotFather` в Telegram.
2. Выполните `/newbot`.
3. Укажите имя и username бота.
4. Скопируйте токен и вставьте его в `.env` как `BOT_TOKEN`.

## Как узнать ADMIN_TELEGRAM_ID

Самый простой способ:

1. Напишите `@userinfobot` в Telegram.
2. Скопируйте свой numeric ID.
3. Вставьте его в `.env` как `ADMIN_TELEGRAM_ID`.

## Как подключить Mini App в BotFather

Для Telegram Mini App нужен публичный HTTPS URL. Для локальной разработки можно использовать ngrok, Cloudflare Tunnel или другой туннель.

1. Запустите frontend на `http://localhost:5173`.
2. Откройте публичный HTTPS-туннель на этот порт.
3. Укажите полученный URL в `.env` как `MINI_APP_URL`.
4. В `@BotFather` откройте вашего бота.
5. Выполните `/mybots` → выберите бота → `Bot Settings` → `Menu Button`.
6. Выберите `Configure menu button`, задайте текст кнопки и HTTPS URL Mini App.
7. При необходимости настройте `/setdomain` для домена Mini App.

В самом боте также есть кнопка `Открыть Mini App`, которая использует `MINI_APP_URL`.

## Админские функции

Администратор получает уведомление по каждому заказу:

- ID заказа.
- Имя пользователя.
- Telegram ID.
- Username.
- Услуга.
- Тема.
- Предмет.
- Срок.
- Комментарий.
- Дата создания.

Статус заказа меняется inline-кнопками:

- `В работе`.
- `Завершен`.
- `Отменен`.

Команда администратора:

```text
/orders
```

Показывает новые заказы. Команда работает только для `ADMIN_TELEGRAM_ID`.

Также доступны admin API endpoints с заголовком `X-Admin-Token`:

- `GET /api/admin/orders`
- `PATCH /api/admin/orders/{order_id}/status`
- `PATCH /api/admin/reviews/{review_id}/approve`

## API

Основные endpoints:

- `GET /api/services` — активные услуги.
- `POST /api/orders` — создать заказ.
- `GET /api/orders/my` — заказы текущего пользователя.
- `GET /api/reviews` — одобренные отзывы.
- `POST /api/reviews` — оставить отзыв.

Mini App отправляет Telegram `initData` в заголовке `X-Telegram-Init-Data`. Backend проверяет подпись через `BOT_TOKEN`. Для локальной разработки можно оставить `ALLOW_DEV_AUTH=true`.

## Миграции

Начальная миграция находится в `backend/alembic/versions/0001_initial.py`.

Применить миграции:

```bash
alembic upgrade head
```

В MVP API также создает таблицы автоматически на старте, чтобы локальный запуск был проще.
