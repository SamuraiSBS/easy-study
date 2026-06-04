from app.models import User


async def test_admin_access_requires_admin(client):
    response = await client.get("/api/admin/orders")

    assert response.status_code == 403


async def test_admin_user_can_list_orders(client, session_factory, auth_header):
    async with session_factory() as db:
        db.add(User(telegram_id="5000", first_name="Admin", username="admin_5000", is_admin=True))
        await db.commit()

    response = await client.get("/api/admin/orders", headers=auth_header("5000"))

    assert response.status_code == 200
    assert response.json() == []

