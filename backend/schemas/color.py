from pydantic import BaseModel
from datetime import datetime


class ColorBase(BaseModel):
    name: str
    hex_code: str | None = None


class ColorCreate(ColorBase):
    pass


class ColorUpdate(BaseModel):
    name: str | None = None
    hex_code: str | None = None


class ColorResponse(ColorBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
