from sqlalchemy import desc, select
from sqlalchemy.orm import Session, joinedload

from app.models import Order, OrderStatus, Review, Service, User
from app.schemas import OrderCreate, ReviewCreate, TelegramUser


def upsert_user(db: Session, telegram_user: TelegramUser) -> User:
    user = db.scalar(select(User).where(User.telegram_id == telegram_user.id))
    if user is None:
        user = User(
            telegram_id=telegram_user.id,
            username=telegram_user.username,
            first_name=telegram_user.first_name,
            last_name=telegram_user.last_name,
        )
        db.add(user)
    else:
        user.username = telegram_user.username
        user.first_name = telegram_user.first_name
        user.last_name = telegram_user.last_name
    db.commit()
    db.refresh(user)
    return user


def list_active_services(db: Session) -> list[Service]:
    return list(db.scalars(select(Service).where(Service.is_active.is_(True)).order_by(Service.id)).all())


def create_order(db: Session, user: User, payload: OrderCreate) -> Order:
    service = db.get(Service, payload.service_id)
    if service is None or not service.is_active:
        raise ValueError("Service is not available")
    order = Order(
        user_id=user.id,
        service_id=service.id,
        topic=payload.topic,
        subject=payload.subject,
        deadline=payload.deadline,
        comment=payload.comment,
        status=OrderStatus.NEW,
    )
    db.add(order)
    db.commit()
    return get_order(db, order.id)


def get_order(db: Session, order_id: int) -> Order:
    order = db.scalar(
        select(Order)
        .options(joinedload(Order.user), joinedload(Order.service))
        .where(Order.id == order_id)
    )
    if order is None:
        raise ValueError("Order not found")
    return order


def list_user_orders(db: Session, user: User) -> list[Order]:
    return list(
        db.scalars(
            select(Order)
            .options(joinedload(Order.service))
            .where(Order.user_id == user.id)
            .order_by(desc(Order.created_at))
        ).all()
    )


def list_orders(db: Session, status: OrderStatus | None = None) -> list[Order]:
    query = select(Order).options(joinedload(Order.user), joinedload(Order.service)).order_by(desc(Order.created_at))
    if status is not None:
        query = query.where(Order.status == status)
    return list(db.scalars(query).all())


def update_order_status(db: Session, order_id: int, status: OrderStatus) -> Order:
    order = get_order(db, order_id)
    order.status = status
    db.commit()
    return get_order(db, order.id)


def create_review(db: Session, user: User, payload: ReviewCreate) -> Review:
    if payload.order_id is not None:
        order = db.get(Order, payload.order_id)
        if order is None or order.user_id != user.id:
            raise ValueError("Order is not available for review")

    review = Review(
        user_id=user.id,
        order_id=payload.order_id,
        rating=payload.rating,
        text=payload.text,
        is_approved=False,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def list_approved_reviews(db: Session) -> list[Review]:
    return list(
        db.scalars(
            select(Review)
            .options(joinedload(Review.user))
            .where(Review.is_approved.is_(True))
            .order_by(desc(Review.created_at))
            .limit(50)
        ).all()
    )


def approve_review(db: Session, review_id: int, is_approved: bool = True) -> Review:
    review = db.get(Review, review_id)
    if review is None:
        raise ValueError("Review not found")
    review.is_approved = is_approved
    db.commit()
    db.refresh(review)
    return review
