from pydantic import BaseModel
from datetime import datetime


class MaterialBase(BaseModel):
    name: str
    slug: str
    description: str | None = None


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    is_active: bool | None = None


class MaterialResponse(MaterialBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
