from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_session
from app.models import Order, Review, Service, User
from app.schemas import OrderCreate, OrderRead, ReviewCreate, ReviewRead
from app.services.notifications import notify_admins_about_new_order

router = APIRouter(prefix="/orders", tags=["orders"])


async def get_order_or_404(db: AsyncSession, order_id: int) -> Order:
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(
        select(Service).where(Service.id == payload.service_id, Service.is_active.is_(True))
    )
    service = result.scalar_one_or_none()
    if service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    order = Order(
        user_id=current_user.id,
        service_id=service.id,
        title_snapshot=service.title,
        description_snapshot=service.description,
        price_from_snapshot=service.price_from,
        price_to_snapshot=service.price_to,
        category_snapshot=service.category,
        customer_comment=payload.customer_comment.strip(),
        status="new",
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    await notify_admins_about_new_order(db, order.id)
    return order


@router.get("/my", response_model=list[OrderRead])
async def list_my_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(
        select(Order).where(Order.user_id == current_user.id).order_by(Order.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    order = await get_order_or_404(db, order_id)
    if order.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Order access is denied")
    return order


@router.post("/{order_id}/review", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
async def create_review(
    order_id: int,
    payload: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    order = await get_order_or_404(db, order_id)
    if order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Order access is denied")
    if order.status != "done":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Review is available after completion")

    existing_result = await db.execute(
        select(Review).where(Review.order_id == order.id, Review.user_id == current_user.id)
    )
    if existing_result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Review already exists")

    review = Review(
        user_id=current_user.id,
        order_id=order.id,
        rating=payload.rating,
        text=payload.text.strip(),
        is_published=False,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review

