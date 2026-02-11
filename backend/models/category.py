from sqlalchemy import Column, Integer, String, DateTime, func, Text, Boolean
from database.db import Base
from datetime import datetime


class Category(Base):
    __tablename__ = "categories"

    # Identificação
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)  # URL-friendly name
    
    # Descrição
    description = Column(Text, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
