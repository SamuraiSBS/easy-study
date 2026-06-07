from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

OrderStatus = Literal["new", "contacted", "in_progress", "done", "cancelled"]


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    telegram_id: str
    first_name: str | None = None
    username: str | None = None
    photo_url: str | None = None
    is_admin: bool
    created_at: datetime
    updated_at: datetime


class ServiceBase(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    description: str = Field(min_length=5)
    price_from: int = Field(ge=0)
    price_to: int | None = Field(default=None, ge=0)
    category: str = Field(min_length=2, max_length=120)
    is_active: bool = True
    order_num: int = 100

    @model_validator(mode="after")
    def validate_price_range(self):
        if self.price_to is not None and self.price_to < self.price_from:
            raise ValueError("price_to must be greater than or equal to price_from")
        return self


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=180)
    description: str | None = Field(default=None, min_length=5)
    price_from: int | None = Field(default=None, ge=0)
    price_to: int | None = Field(default=None, ge=0)
    category: str | None = Field(default=None, min_length=2, max_length=120)
    is_active: bool | None = None
    order_num: int | None = None


class ServiceRead(ServiceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class ServiceReviewRead(BaseModel):
    id: int
    order_id: int | None
    rating: int
    text: str
    created_at: datetime
    user_name: str


class ServiceWithReviewsRead(ServiceRead):
    reviews: list[ServiceReviewRead] = []


class OrderCreate(BaseModel):
    service_id: int
    customer_comment: str = Field(default="", max_length=4000)


class OrderAttachmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    original_filename: str
    content_type: str | None
    size_bytes: int
    created_at: datetime


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    order_id: int | None
    rating: int
    text: str
    is_published: bool
    created_at: datetime


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    service_id: int | None
    title_snapshot: str
    description_snapshot: str
    price_from_snapshot: int
    price_to_snapshot: int | None
    category_snapshot: str
    customer_comment: str
    status: OrderStatus
    admin_comment: str | None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None
    attachments: list[OrderAttachmentRead] = []
    review: ReviewRead | None = None


class AdminOrderRead(OrderRead):
    user: UserRead


class AdminOrderUpdate(BaseModel):
    status: OrderStatus | None = None
    admin_comment: str | None = Field(default=None, max_length=4000)


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    text: str = Field(min_length=2, max_length=3000)


class AdminReviewRead(ReviewRead):
    user: UserRead


class ReviewModerationUpdate(BaseModel):
    is_published: bool


class OkResponse(BaseModel):
    ok: bool
