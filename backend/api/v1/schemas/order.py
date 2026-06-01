from pydantic import BaseModel, Field, field_serializer
from datetime import datetime
from decimal import Decimal
from typing import Optional, List


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)


class OrderCreateRequest(BaseModel):
    items: List[OrderItemCreate]
    payment_method: Optional[str] = None


class OrderConfirmPaymentRequest(BaseModel):
    reference: str = Field(..., min_length=3, max_length=120)


class OrderItemResponse(BaseModel):
    product_id: int
    product_name: str
    unit_price: Decimal
    quantity: int
    total_price: Decimal

    @field_serializer("unit_price", "total_price")
    def serialize_decimal_as_float(self, value: Decimal) -> float:
        return float(value)

    class Config:
        from_attributes = True


class OrderUserSummary(BaseModel):
    id: int
    username: str
    email: Optional[str] = None

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    status: str
    payment_method: str
    total_amount: Decimal
    pix_txid: Optional[str] = None
    pix_key: Optional[str] = None
    payment_reference: Optional[str] = None
    payment_reported_at: Optional[datetime]
    paid_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse]

    @field_serializer("total_amount")
    def serialize_total_amount(self, value: Decimal) -> float:
        return float(value)

    class Config:
        from_attributes = True


class OrderAdminResponse(OrderResponse):
    user: OrderUserSummary
