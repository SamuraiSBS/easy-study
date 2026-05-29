from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app import crud
from app.config import get_settings
from app.database import Base, SessionLocal, engine, get_db
from app.models import OrderStatus
from app.notifications import notify_admin_order, notify_admin_review
from app.schemas import (
    AdminOrderRead,
    OrderCreate,
    OrderRead,
    OrderStatusUpdate,
    ReviewCreate,
    ReviewRead,
    ServiceRead,
    SuccessResponse,
)
from app.services_seed import seed_services
from app.telegram_auth import get_telegram_user_from_request

app = FastAPI(title="Easy Study API", version="0.1.0")
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_services(db)


def require_admin(x_admin_token: str = Header(default="")) -> None:
    if not settings.admin_api_token or x_admin_token != settings.admin_api_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin token is invalid")


def serialize_admin_order(order) -> AdminOrderRead:
    return AdminOrderRead(
        id=order.id,
        service=order.service,
        topic=order.topic,
        subject=order.subject,
        deadline=order.deadline,
        comment=order.comment,
        status=order.status,
        created_at=order.created_at,
        updated_at=order.updated_at,
        user_id=order.user_id,
        telegram_id=order.user.telegram_id,
        username=order.user.username,
        first_name=order.user.first_name,
        last_name=order.user.last_name,
    )


@app.get("/health")
def health() -> SuccessResponse:
    return SuccessResponse()


@app.get("/api/services", response_model=list[ServiceRead])
def get_services(db: Session = Depends(get_db)) -> list:
    return crud.list_active_services(db)


@app.get("/api/me")
async def get_me(request: Request, db: Session = Depends(get_db)):
    telegram_user = await get_telegram_user_from_request(request)
    user = crud.upsert_user(db, telegram_user)
    return {
        "id": user.id,
        "telegram_id": user.telegram_id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
    }


@app.post("/api/orders", response_model=OrderRead)
async def post_order(payload: OrderCreate, request: Request, db: Session = Depends(get_db)):
    telegram_user = await get_telegram_user_from_request(request)
    user = crud.upsert_user(db, telegram_user)
    try:
        order = crud.create_order(db, user, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    await notify_admin_order(order)
    return order


@app.get("/api/orders/my", response_model=list[OrderRead])
async def get_my_orders(request: Request, db: Session = Depends(get_db)):
    telegram_user = await get_telegram_user_from_request(request)
    user = crud.upsert_user(db, telegram_user)
    return crud.list_user_orders(db, user)


@app.post("/api/reviews", response_model=SuccessResponse)
async def post_review(payload: ReviewCreate, request: Request, db: Session = Depends(get_db)):
    telegram_user = await get_telegram_user_from_request(request)
    user = crud.upsert_user(db, telegram_user)
    try:
        review = crud.create_review(db, user, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    review.user = user
    await notify_admin_review(review)
    return SuccessResponse()


@app.get("/api/reviews", response_model=list[ReviewRead])
def get_reviews(db: Session = Depends(get_db)) -> list[ReviewRead]:
    reviews = crud.list_approved_reviews(db)
    return [
        ReviewRead(
            id=review.id,
            rating=review.rating,
            text=review.text,
            order_id=review.order_id,
            created_at=review.created_at,
            first_name=review.user.first_name,
            username=review.user.username,
        )
        for review in reviews
    ]


@app.get("/api/admin/orders", response_model=list[AdminOrderRead], dependencies=[Depends(require_admin)])
def admin_orders(status_filter: OrderStatus | None = None, db: Session = Depends(get_db)):
    orders = crud.list_orders(db, status_filter)
    return [serialize_admin_order(order) for order in orders]


@app.patch("/api/admin/orders/{order_id}/status", response_model=AdminOrderRead, dependencies=[Depends(require_admin)])
def admin_update_order(order_id: int, payload: OrderStatusUpdate, db: Session = Depends(get_db)):
    try:
        order = crud.update_order_status(db, order_id, payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return serialize_admin_order(order)


@app.patch("/api/admin/reviews/{review_id}/approve", response_model=SuccessResponse, dependencies=[Depends(require_admin)])
def admin_approve_review(review_id: int, is_approved: bool = True, db: Session = Depends(get_db)):
    try:
        crud.approve_review(db, review_id, is_approved)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return SuccessResponse()
