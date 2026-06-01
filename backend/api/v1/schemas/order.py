from pydantic import BaseModel, Field, field_serializer
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Literal
from api.v1.schemas.address import ShippingAddress

OrderStatus = Literal["pending_payment", "payment_reported", "paid", "delivered", "cancelled"]


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)


class OrderCreateRequest(BaseModel):
    items: List[OrderItemCreate] = Field(..., min_length=1)
    payment_method: Literal["pix"] = "pix"
    accept_terms: bool = False
    terms_version: str = Field(..., min_length=1, max_length=20)
    shipping_address: ShippingAddress


class OrderMarkDeliveredRequest(BaseModel):
    delivery_note: str | None = Field(None, max_length=255)


class PurchaseTermsResponse(BaseModel):
    version: str
    title: str
    summary: str
    clauses: List[str]
    delivery_commitment_days: int


class OrderConfirmPaymentRequest(BaseModel):
    reference: str = Field(..., min_length=3, max_length=120)


class OrderItemResponse(BaseModel):
    product_id: int
    product_name: str
    unit_price: Decimal
    quantity: int
    total_price: Decimal

    @field_serializer("unit_price", "total_price")
    def serialize_decimal_as_str(self, value: Decimal) -> str:
        return format(value, "f")

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
    user_id: int
    buyer_username: Optional[str] = None
    buyer_email: Optional[str] = None
    status: OrderStatus
    payment_method: str
    total_amount: Decimal
    pix_txid: Optional[str] = None
    pix_key: Optional[str] = None
    payment_reference: Optional[str] = None
    payment_reported_at: Optional[datetime]
    paid_at: Optional[datetime]
    terms_version: Optional[str] = None
    terms_accepted_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    delivery_note: Optional[str] = None
    shipping_recipient_name: Optional[str] = None
    shipping_phone: Optional[str] = None
    shipping_postal_code: Optional[str] = None
    shipping_street: Optional[str] = None
    shipping_number: Optional[str] = None
    shipping_complement: Optional[str] = None
    shipping_neighborhood: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_state: Optional[str] = None
    shipping_address_formatted: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse]

    @field_serializer("total_amount")
    def serialize_total_amount(self, value: Decimal) -> str:
        return format(value, "f")

    class Config:
        from_attributes = True


class OrderAdminResponse(OrderResponse):
    user: Optional[OrderUserSummary] = None
