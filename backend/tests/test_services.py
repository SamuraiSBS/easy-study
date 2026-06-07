from app.models import Order, Review, Service, User


def make_service(title: str, order_num: int) -> Service:
    return Service(
        title=title,
        description=f"{title} preparation",
        price_from=1000,
        price_to=2000,
        category="Writing",
        is_active=True,
        order_num=order_num,
    )


def make_order(user: User, service: Service, title: str) -> Order:
    return Order(
        user=user,
        service=service,
        title_snapshot=title,
        description_snapshot=service.description,
        price_from_snapshot=service.price_from,
        price_to_snapshot=service.price_to,
        category_snapshot=service.category,
        customer_comment="Need help",
        status="done",
    )


async def test_get_service_includes_only_published_reviews_for_that_service(client, session_factory):
    async with session_factory() as db:
        service = make_service("Essay", 1)
        other_service = make_service("Presentation", 2)
        user = User(telegram_id="3001", first_name="Alice", username="alice", is_admin=False)
        other_user = User(telegram_id="3002", first_name="Bob", username="bob", is_admin=False)
        db.add_all([service, other_service, user, other_user])
        await db.flush()

        published_order = make_order(user, service, "Essay")
        hidden_order = make_order(other_user, service, "Essay")
        other_service_order = make_order(other_user, other_service, "Presentation")
        db.add_all([published_order, hidden_order, other_service_order])
        await db.flush()

        db.add_all(
            [
                Review(user=user, order=published_order, rating=5, text="Great essay", is_published=True),
                Review(user=other_user, order=hidden_order, rating=2, text="Hidden review", is_published=False),
                Review(user=other_user, order=other_service_order, rating=4, text="Other service", is_published=True),
            ]
        )
        await db.commit()
        service_id = service.id

    response = await client.get(f"/api/services/{service_id}")

    assert response.status_code == 200
    reviews = response.json()["reviews"]
    assert len(reviews) == 1
    assert reviews[0]["rating"] == 5
    assert reviews[0]["text"] == "Great essay"
    assert reviews[0]["user_name"] == "Alice"
