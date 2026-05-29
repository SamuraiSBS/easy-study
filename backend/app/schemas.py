from datetime import datetime

from pydantic import BaseModel, Field

from app.models import OrderStatus


class TelegramUser(BaseModel):
    id: int
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None


class ServiceRead(BaseModel):
    id: int
    title: str
    description: str
    price_from: int
    estimated_time: str

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    service_id: int
    topic: str = Field(min_length=2, max_length=500)
    subject: str | None = Field(default=None, max_length=255)
    deadline: str = Field(min_length=1, max_length=255)
    comment: str | None = Field(default=None, max_length=3000)


class OrderRead(BaseModel):
    id: int
    service: ServiceRead
    topic: str
    subject: str | None
    deadline: str
    comment: str | None
    status: OrderStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AdminOrderRead(OrderRead):
    user_id: int
    telegram_id: int
    username: str | None
    first_name: str | None
    last_name: str | None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    text: str = Field(min_length=3, max_length=2000)
    order_id: int | None = None


class ReviewRead(BaseModel):
    id: int
    rating: int
    text: str
    order_id: int | None
    created_at: datetime
    first_name: str | None
    username: str | None


class SuccessResponse(BaseModel):
    ok: bool = True
