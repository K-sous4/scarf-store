from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models.user import User
from models.color import Color
from schemas.color import ColorCreate, ColorUpdate, ColorResponse
from database.db import get_db
from api.v1.dependencies import get_current_admin
from services.cache import cache
from typing import List

router = APIRouter(prefix="/colors", tags=["colors"])

_CACHE_PREFIX = "filter:colors"


# ============= PUBLIC =============

@router.get("/", response_model=List[ColorResponse])
async def list_colors(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Lista todas as cores (público) — cache-aside (TTL 5 min)
    """
    cache_key = f"{_CACHE_PREFIX}:{skip}:{limit}"

    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    rows = db.query(Color).offset(skip).limit(limit).all()
    result = [ColorResponse.model_validate(r).model_dump() for r in rows]
    cache.set(cache_key, result)
    return result


@router.get("/{color_id}", response_model=ColorResponse)
async def get_color(color_id: int, db: Session = Depends(get_db)):
    """
    Obtém uma cor pelo ID (público)
    """
    color = db.query(Color).filter(Color.id == color_id).first()
    if not color:
        raise HTTPException(status_code=404, detail="Cor não encontrada")
    return color


# ============= ADMIN =============

@router.post("/", response_model=ColorResponse, status_code=status.HTTP_201_CREATED)
async def create_color(
    color: ColorCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Cria uma nova cor (admin)
    """
    existing = db.query(Color).filter(Color.name == color.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cor com este nome já existe")

    db_color = Color(**color.dict())
    db.add(db_color)
    db.commit()
    db.refresh(db_color)
    cache.invalidate_pattern(f"{_CACHE_PREFIX}:*")
    return db_color


@router.put("/{color_id}", response_model=ColorResponse)
async def update_color(
    color_id: int,
    color_data: ColorUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Atualiza uma cor (admin)
    """
    db_color = db.query(Color).filter(Color.id == color_id).first()
    if not db_color:
        raise HTTPException(status_code=404, detail="Cor não encontrada")

    if color_data.name:
        existing = db.query(Color).filter(
            Color.name == color_data.name,
            Color.id != color_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Cor com este nome já existe")

    for key, value in color_data.dict(exclude_unset=True).items():
        setattr(db_color, key, value)

    db.commit()
    db.refresh(db_color)
    cache.invalidate_pattern(f"{_CACHE_PREFIX}:*")
    return db_color


@router.delete("/{color_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_color(
    color_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Deleta uma cor (admin)
    """
    db_color = db.query(Color).filter(Color.id == color_id).first()
    if not db_color:
        raise HTTPException(status_code=404, detail="Cor não encontrada")

    db.delete(db_color)
    db.commit()
    cache.invalidate_pattern(f"{_CACHE_PREFIX}:*")
