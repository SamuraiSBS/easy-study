import shutil
from pathlib import Path
from uuid import uuid4

from app.config import settings
from app.models import Order, Service, User
from app.services.telegram_bot import telegram_bot


async def test_create_order_sends_admin_notification(client, session_factory, monkeypatch):
    async with session_factory() as db:
        service = Service(
            title="Доклад",
            description="Подготовка доклада",
            price_from=1500,
            price_to=4000,
            category="Работы",
            is_active=True,
            order_num=1,
        )
        admin = User(telegram_id="999", first_name="Admin", username="admin", is_admin=True)
        db.add_all([service, admin])
        await db.commit()
        await db.refresh(service)
        service_id = service.id

    messages: list[dict] = []

    async def fake_send_message(chat_id: str, text: str, reply_markup: dict | None = None):
        messages.append({"chat_id": chat_id, "text": text, "reply_markup": reply_markup})
        return {"ok": True}

    monkeypatch.setattr(settings, "telegram_bot_token", "test-bot-token")
    monkeypatch.setattr(telegram_bot, "send_message", fake_send_message)

    response = await client.post(
        "/api/orders",
        json={"service_id": service_id, "customer_comment": "Нужен доклад по истории"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "new"
    assert data["title_snapshot"] == "Доклад"
    assert messages
    assert messages[0]["chat_id"] == "999"
    assert "Новая заявка" in messages[0]["text"]
    assert "Нужен доклад по истории" in messages[0]["text"]


async def test_create_order_with_attachments(client, session_factory, monkeypatch):
    upload_dir = Path(__file__).resolve().parents[1] / "pytest-cache-files-uploads" / uuid4().hex
    monkeypatch.setattr(settings, "upload_dir", str(upload_dir))
    async with session_factory() as db:
        service = Service(
            title="Презентация",
            description="Подготовка презентации",
            price_from=1200,
            price_to=2500,
            category="Работы",
            is_active=True,
            order_num=1,
        )
        db.add(service)
        await db.commit()
        await db.refresh(service)
        service_id = service.id

    monkeypatch.setattr(settings, "telegram_bot_token", "test-bot-token")
    monkeypatch.setattr(telegram_bot, "send_message", lambda *args, **kwargs: {"ok": True})

    try:
        response = await client.post(
            "/api/orders",
            data={"service_id": str(service_id), "customer_comment": "Есть требования в файле"},
            files=[
                ("attachments", ("requirements.txt", b"deadline: monday", "text/plain")),
                ("attachments", ("photo.jpg", b"fake-image", "image/jpeg")),
            ],
        )

        assert response.status_code == 201
        data = response.json()
        assert len(data["attachments"]) == 2
        assert data["attachments"][0]["original_filename"] == "requirements.txt"

        attachment_id = data["attachments"][0]["id"]
        download = await client.get(f"/api/orders/{data['id']}/attachments/{attachment_id}")
        assert download.status_code == 200
        assert download.content == b"deadline: monday"
    finally:
        shutil.rmtree(upload_dir, ignore_errors=True)


async def test_create_order_rejects_more_than_five_attachments(client, session_factory):
    async with session_factory() as db:
        service = Service(
            title="Реферат",
            description="Подготовка реферата",
            price_from=900,
            price_to=None,
            category="Работы",
            is_active=True,
            order_num=1,
        )
        db.add(service)
        await db.commit()
        await db.refresh(service)
        service_id = service.id

    response = await client.post(
        "/api/orders",
        data={"service_id": str(service_id), "customer_comment": ""},
        files=[("attachments", (f"file-{index}.txt", b"x", "text/plain")) for index in range(6)],
    )

    assert response.status_code == 400


async def test_get_order_includes_existing_review(client, session_factory):
    async with session_factory() as db:
        service = Service(
            title="Essay",
            description="Essay preparation",
            price_from=1000,
            price_to=2000,
            category="Writing",
            is_active=True,
            order_num=1,
        )
        db.add(service)
        await db.commit()
        await db.refresh(service)
        service_id = service.id

    response = await client.post(
        "/api/orders",
        json={"service_id": service_id, "customer_comment": "Need an essay"},
    )
    assert response.status_code == 201
    order_id = response.json()["id"]

    async with session_factory() as db:
        order = await db.get(Order, order_id)
        assert order is not None
        order.status = "done"
        await db.commit()

    review_response = await client.post(
        f"/api/orders/{order_id}/review",
        json={"rating": 4, "text": "Good work"},
    )
    assert review_response.status_code == 201

    order_response = await client.get(f"/api/orders/{order_id}")
    assert order_response.status_code == 200
    review = order_response.json()["review"]
    assert review["rating"] == 4
    assert review["text"] == "Good work"
