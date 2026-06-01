from pydantic import BaseModel, Field
from datetime import datetime


class PaymentSettingsBase(BaseModel):
    phone_number: str | None = None
    delivery_commitment_days: int = Field(default=7, ge=1, le=60)


class PaymentSettingsUpdate(PaymentSettingsBase):
    pass


class PaymentSettingsResponse(PaymentSettingsBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaymentSettingsPublic(BaseModel):
    phone_number: str | None = None
    delivery_commitment_days: int = 7
