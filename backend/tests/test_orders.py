from app.config import settings
from app.models import Service, User
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

