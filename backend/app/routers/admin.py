from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies import require_admin
from app.database import get_session
from app.models import ORDER_STATUSES, Order, Review, Service, User
from app.schemas import (
    AdminOrderRead,
    AdminOrderUpdate,
    AdminReviewRead,
    OkResponse,
    ReviewModerationUpdate,
    ServiceCreate,
    ServiceRead,
    ServiceUpdate,
    UserRead,
)
from app.services.notifications import notify_user_review_request

router = APIRouter(prefix="/admin", tags=["admin"])


async def admin_order_or_404(db: AsyncSession, order_id: int) -> Order:
    result = await db.execute(
        select(Order).options(selectinload(Order.user)).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


async def service_or_404(db: AsyncSession, service_id: int) -> Service:
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return service


@router.get("/orders", response_model=list[AdminOrderRead])
async def list_orders(
    order_status: str | None = Query(default=None, alias="status"),
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    query = select(Order).options(selectinload(Order.user)).order_by(Order.created_at.desc())
    if order_status:
        if order_status not in ORDER_STATUSES:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid order status")
        query = query.where(Order.status == order_status)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/orders/{order_id}", response_model=AdminOrderRead)
async def get_order(
    order_id: int,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    return await admin_order_or_404(db, order_id)


@router.patch("/orders/{order_id}", response_model=AdminOrderRead)
async def update_order(
    order_id: int,
    payload: AdminOrderUpdate,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    order = await admin_order_or_404(db, order_id)
    previous_status = order.status

    if payload.status is not None:
        order.status = payload.status
        order.completed_at = datetime.now(timezone.utc) if payload.status == "done" else None
    if payload.admin_comment is not None:
        order.admin_comment = payload.admin_comment.strip()

    await db.commit()
    await db.refresh(order)
    order = await admin_order_or_404(db, order_id)

    if previous_status != "done" and order.status == "done":
        await notify_user_review_request(db, order.id)
    return order


@router.get("/services", response_model=list[ServiceRead])
async def list_admin_services(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(select(Service).order_by(Service.order_num.asc(), Service.title.asc()))
    return result.scalars().all()


@router.post("/services", response_model=ServiceRead, status_code=status.HTTP_201_CREATED)
async def create_service(
    payload: ServiceCreate,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    service = Service(**payload.model_dump())
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return service


@router.patch("/services/{service_id}", response_model=ServiceRead)
async def update_service(
    service_id: int,
    payload: ServiceUpdate,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    service = await service_or_404(db, service_id)
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(service, key, value)
    if service.price_to is not None and service.price_to < service.price_from:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid price range")
    await db.commit()
    await db.refresh(service)
    return service


@router.delete("/services/{service_id}", response_model=OkResponse)
async def delete_service(
    service_id: int,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    service = await service_or_404(db, service_id)
    service.is_active = False
    await db.commit()
    return {"ok": True}


@router.get("/reviews", response_model=list[AdminReviewRead])
async def list_reviews(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(
        select(Review).options(selectinload(Review.user)).order_by(Review.created_at.desc())
    )
    return result.scalars().all()


@router.patch("/reviews/{review_id}", response_model=AdminReviewRead)
async def update_review(
    review_id: int,
    payload: ReviewModerationUpdate,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(
        select(Review).options(selectinload(Review.user)).where(Review.id == review_id)
    )
    review = result.scalar_one_or_none()
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    review.is_published = payload.is_published
    await db.commit()
    await db.refresh(review)
    result = await db.execute(
        select(Review).options(selectinload(Review.user)).where(Review.id == review_id)
    )
    return result.scalar_one()


@router.get("/users", response_model=list[UserRead])
async def list_users(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()

