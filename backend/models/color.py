from sqlalchemy import Column, Integer, String, DateTime, func
from database.db import Base
from datetime import datetime


class Color(Base):
    __tablename__ = "colors"

    # Identificação
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)  # ex: "Red", "Blue", "Black"
    hex_code = Column(String(7), nullable=True)  # ex: "#FF0000" para representação visual
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
