from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.user import User
from models.payment_settings import PaymentSettings
from schemas.payment_settings import PaymentSettingsUpdate, PaymentSettingsResponse, PaymentSettingsPublic
from database.db import get_db
from api.v1.dependencies import get_current_admin

router = APIRouter(prefix="/payment-settings", tags=["payment-settings"])


def _normalize_phone(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


@router.get("", response_model=PaymentSettingsResponse)
async def get_payment_settings(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    settings = db.query(PaymentSettings).first()
    if not settings:
        settings = PaymentSettings(phone_number=None, delivery_commitment_days=7)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("/public", response_model=PaymentSettingsPublic)
async def get_payment_settings_public(db: Session = Depends(get_db)):
    settings = db.query(PaymentSettings).first()
    if not settings:
        return {"phone_number": None, "delivery_commitment_days": 7}
    return {
        "phone_number": settings.phone_number,
        "delivery_commitment_days": settings.delivery_commitment_days or 7,
    }


@router.put("", response_model=PaymentSettingsResponse)
async def update_payment_settings(
    payload: PaymentSettingsUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    settings = db.query(PaymentSettings).first()
    phone_number = _normalize_phone(payload.phone_number)
    if not settings:
        settings = PaymentSettings(
            phone_number=phone_number,
            delivery_commitment_days=payload.delivery_commitment_days,
        )
        db.add(settings)
    else:
        settings.phone_number = phone_number
        settings.delivery_commitment_days = payload.delivery_commitment_days

    db.commit()
    db.refresh(settings)
    return settings
