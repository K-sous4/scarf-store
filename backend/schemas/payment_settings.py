from pydantic import BaseModel
from datetime import datetime


class PaymentSettingsBase(BaseModel):
    phone_number: str | None = None


class PaymentSettingsUpdate(PaymentSettingsBase):
    pass


class PaymentSettingsResponse(PaymentSettingsBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaymentSettingsPublic(PaymentSettingsBase):
    pass
