from sqlalchemy import Column, Integer, String, DateTime, func
from database.db import Base


class PaymentSettings(Base):
    __tablename__ = "payment_settings"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(30), nullable=True)
    delivery_commitment_days = Column(Integer, nullable=False, default=7)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
