from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import Order, Review, Service, User
from app.schemas import ServiceReviewRead, ServiceWithReviewsRead

router = APIRouter(prefix="/services", tags=["services"])


def public_user_name(user: User) -> str:
    return user.first_name or (f"@{user.username}" if user.username else "Клиент")


async def get_published_service_reviews(db: AsyncSession, service_ids: list[int]) -> dict[int, list[ServiceReviewRead]]:
    if not service_ids:
        return {}

    result = await db.execute(
        select(Review, Order.service_id, User)
        .join(Order, Review.order_id == Order.id)
        .join(User, Review.user_id == User.id)
        .where(Order.service_id.in_(service_ids), Review.is_published.is_(True))
        .order_by(Review.created_at.desc())
    )

    reviews_by_service: dict[int, list[ServiceReviewRead]] = {service_id: [] for service_id in service_ids}
    for review, service_id, user in result.all():
        if service_id is None:
            continue
        reviews_by_service.setdefault(service_id, []).append(
            ServiceReviewRead(
                id=review.id,
                order_id=review.order_id,
                rating=review.rating,
                text=review.text,
                created_at=review.created_at,
                user_name=public_user_name(user),
            )
        )
    return reviews_by_service


def serialize_service(service: Service, reviews: list[ServiceReviewRead]) -> ServiceWithReviewsRead:
    return ServiceWithReviewsRead.model_validate(
        {
            "id": service.id,
            "title": service.title,
            "description": service.description,
            "price_from": service.price_from,
            "price_to": service.price_to,
            "category": service.category,
            "is_active": service.is_active,
            "order_num": service.order_num,
            "created_at": service.created_at,
            "updated_at": service.updated_at,
            "reviews": reviews,
        }
    )


@router.get("", response_model=list[ServiceWithReviewsRead])
async def list_services(db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(Service)
        .where(Service.is_active.is_(True))
        .order_by(Service.order_num.asc(), Service.title.asc())
    )
    services = list(result.scalars().all())
    reviews_by_service = await get_published_service_reviews(db, [service.id for service in services])
    return [serialize_service(service, reviews_by_service.get(service.id, [])) for service in services]


@router.get("/{service_id}", response_model=ServiceWithReviewsRead)
async def get_service(service_id: int, db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(Service).where(Service.id == service_id, Service.is_active.is_(True))
    )
    service = result.scalar_one_or_none()
    if service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    reviews_by_service = await get_published_service_reviews(db, [service.id])
    return serialize_service(service, reviews_by_service.get(service.id, []))
