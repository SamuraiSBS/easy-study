async def test_auth_me_creates_user(client):
    response = await client.get("/api/auth/me")

    assert response.status_code == 200
    data = response.json()
    assert data["telegram_id"] == "1001"
    assert data["username"] == "user_1001"
    assert data["is_admin"] is False

