from sqlalchemy import Column, Integer, String, DateTime, func
from database.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String(120), nullable=True)
    phone = Column(String(20), nullable=True)
    postal_code = Column(String(9), nullable=True)
    street = Column(String(200), nullable=True)
    number = Column(String(20), nullable=True)
    complement = Column(String(80), nullable=True)
    neighborhood = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(2), nullable=True)
    hashed_password = Column(String)
    role = Column(String, default="user")  # "user" ou "admin"
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
