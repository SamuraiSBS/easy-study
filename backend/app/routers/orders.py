import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from starlette.datastructures import UploadFile

from app.auth.dependencies import get_current_user
from app.config import settings
from app.database import get_session
from app.models import Order, OrderAttachment, Review, Service, User
from app.schemas import OrderCreate, OrderRead, ReviewCreate, ReviewRead
from app.services.notifications import notify_admins_about_new_order

router = APIRouter(prefix="/orders", tags=["orders"])
MAX_ORDER_ATTACHMENTS = 5


async def get_order_or_404(db: AsyncSession, order_id: int) -> Order:
    result = await db.execute(
        select(Order).options(selectinload(Order.attachments), selectinload(Order.reviews)).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


def display_filename(filename: str) -> str:
    name = filename.replace("\\", "/").split("/")[-1].replace("\x00", "").strip()
    return name[:255] or "attachment"


def order_upload_dir(order_id: int) -> Path:
    return Path(settings.upload_dir) / "orders" / str(order_id)


async def parse_order_create(request: Request) -> tuple[OrderCreate, list[UploadFile]]:
    content_type = request.headers.get("content-type", "")
    try:
        if content_type.startswith("multipart/form-data"):
            form = await request.form()
            payload = OrderCreate(
                service_id=int(str(form.get("service_id", ""))),
                customer_comment=str(form.get("customer_comment", "")),
            )
            attachments = [
                value
                for key, value in form.multi_items()
                if key == "attachments" and isinstance(value, UploadFile)
            ]
            if len(attachments) > MAX_ORDER_ATTACHMENTS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Можно добавить до {MAX_ORDER_ATTACHMENTS} файлов",
                )
            return payload, attachments

        return OrderCreate.model_validate(await request.json()), []
    except (TypeError, ValueError, ValidationError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid order payload") from exc


async def save_order_attachments(order_id: int, uploads: list[UploadFile]) -> tuple[list[OrderAttachment], list[Path]]:
    attachments: list[OrderAttachment] = []
    saved_paths: list[Path] = []
    if not uploads:
        return attachments, saved_paths

    upload_dir = order_upload_dir(order_id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    for upload in uploads:
        original_filename = display_filename(upload.filename or "attachment")
        suffix = Path(original_filename).suffix[:20]
        stored_filename = f"{uuid4().hex}{suffix}"
        destination = upload_dir / stored_filename
        content = await upload.read()
        with destination.open("wb") as file:
            file.write(content)
        saved_paths.append(destination)
        attachments.append(
            OrderAttachment(
                order_id=order_id,
                original_filename=original_filename,
                stored_filename=stored_filename,
                content_type=upload.content_type,
                size_bytes=len(content),
            )
        )

    return attachments, saved_paths


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
async def create_order(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    payload, uploads = await parse_order_create(request)
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
    saved_paths: list[Path] = []
    try:
        db.add(order)
        await db.flush()
        attachments, saved_paths = await save_order_attachments(order.id, uploads)
        db.add_all(attachments)
        await db.commit()
    except Exception:
        await db.rollback()
        for path in saved_paths:
            path.unlink(missing_ok=True)
        if saved_paths:
            shutil.rmtree(order_upload_dir(order.id), ignore_errors=True)
        raise

    order = await get_order_or_404(db, order.id)
    await notify_admins_about_new_order(db, order.id)
    return order


@router.get("/my", response_model=list[OrderRead])
async def list_my_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.attachments), selectinload(Order.reviews))
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
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


@router.get("/{order_id}/attachments/{attachment_id}")
async def download_order_attachment(
    order_id: int,
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    order = await get_order_or_404(db, order_id)
    if order.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Order access is denied")

    attachment = next((item for item in order.attachments if item.id == attachment_id), None)
    if attachment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")

    path = order_upload_dir(order.id) / attachment.stored_filename
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment file not found")

    return FileResponse(
        path,
        media_type=attachment.content_type,
        filename=attachment.original_filename,
    )


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
