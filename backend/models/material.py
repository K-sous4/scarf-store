from sqlalchemy import Column, Integer, String, DateTime, func, Text, Boolean
from database.db import Base
from datetime import datetime


class Material(Base):
    __tablename__ = "materials"

    # Identificação
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)  # URL-friendly name
    
    # Descrição
    description = Column(Text, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, index=True)  # Material disponível para produtos
    
    # Timestamps
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<Material(id={self.id}, name={self.name}, slug={self.slug})>"
