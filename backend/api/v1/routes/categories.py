from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models.user import User
from models.category import Category
from schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from database.db import get_db
from api.v1.dependencies import get_current_admin
from typing import List

router = APIRouter(prefix="/categories", tags=["categories"])


# ============= PUBLIC =============

@router.get("/", response_model=List[CategoryResponse])
async def list_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Lista todas as categorias ativas (público)
    """
    return db.query(Category).filter(Category.is_active == True).offset(skip).limit(limit).all()


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: int, db: Session = Depends(get_db)):
    """
    Obtém uma categoria pelo ID (público)
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return category


# ============= ADMIN =============

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category: CategoryCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Cria uma nova categoria (admin)
    """
    existing = db.query(Category).filter(Category.slug == category.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Categoria com este slug já existe")

    db_category = Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Atualiza uma categoria (admin)
    """
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")

    if category_data.slug:
        existing = db.query(Category).filter(
            Category.slug == category_data.slug,
            Category.id != category_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Slug já existe para outra categoria")

    for key, value in category_data.dict(exclude_unset=True).items():
        setattr(db_category, key, value)

    db.commit()
    db.refresh(db_category)
    return db_category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Deleta uma categoria (admin)
    """
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")

    db.delete(db_category)
    db.commit()
