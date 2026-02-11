from fastapi import APIRouter, Depends, HTTPException, status
from models.user import User
from models.category import Category
from models.color import Color
from models.material import Material
from api.v1.dependencies import get_current_admin
from schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from schemas.color import ColorCreate, ColorUpdate, ColorResponse
from schemas.material import MaterialCreate, MaterialUpdate, MaterialResponse
from sqlalchemy.orm import Session
from database.db import get_db
from typing import List

router = APIRouter(prefix="/admin/parameters", tags=["admin-parameters"])


# ============= CATEGORIES =============

@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Lista todas as categorias (público)
    """
    categories = db.query(Category).filter(Category.is_active == True).offset(skip).limit(limit).all()
    return categories


@router.get("/categories/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtém uma categoria específica pelo ID
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return category


@router.post("/categories", response_model=CategoryResponse)
async def create_category(
    category: CategoryCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Cria uma nova categoria (requer admin)
    """
    # Verifica se já existe categoria com mismo slug
    existing = db.query(Category).filter(Category.slug == category.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Categoria com este slug já existe")
    
    db_category = Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Atualiza uma categoria (requer admin)
    """
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    
    # Verifica se novo slug já existe
    if category_data.slug:
        existing = db.query(Category).filter(
            Category.slug == category_data.slug,
            Category.id != category_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Slug já existe para outra categoria")
    
    update_data = category_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_category, key, value)
    
    db.commit()
    db.refresh(db_category)
    return db_category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Deleta uma categoria (requer admin)
    """
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    
    db.delete(db_category)
    db.commit()


# ============= COLORS =============

@router.get("/colors", response_model=List[ColorResponse])
async def list_colors(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Lista todas as cores (público)
    """
    colors = db.query(Color).offset(skip).limit(limit).all()
    return colors


@router.get("/colors/{color_id}", response_model=ColorResponse)
async def get_color(
    color_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtém uma cor específica pelo ID
    """
    color = db.query(Color).filter(Color.id == color_id).first()
    if not color:
        raise HTTPException(status_code=404, detail="Cor não encontrada")
    return color


@router.post("/colors", response_model=ColorResponse)
async def create_color(
    color: ColorCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Cria uma nova cor (requer admin)
    """
    # Verifica se cor já existe
    existing = db.query(Color).filter(Color.name == color.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cor com este nome já existe")
    
    db_color = Color(**color.dict())
    db.add(db_color)
    db.commit()
    db.refresh(db_color)
    return db_color


@router.put("/colors/{color_id}", response_model=ColorResponse)
async def update_color(
    color_id: int,
    color_data: ColorUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Atualiza uma cor (requer admin)
    """
    db_color = db.query(Color).filter(Color.id == color_id).first()
    if not db_color:
        raise HTTPException(status_code=404, detail="Cor não encontrada")
    
    # Verifica se novo nome já existe
    if color_data.name:
        existing = db.query(Color).filter(
            Color.name == color_data.name,
            Color.id != color_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Cor com este nome já existe")
    
    update_data = color_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_color, key, value)
    
    db.commit()
    db.refresh(db_color)
    return db_color


@router.delete("/colors/{color_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_color(
    color_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Deleta uma cor (requer admin)
    """
    db_color = db.query(Color).filter(Color.id == color_id).first()
    if not db_color:
        raise HTTPException(status_code=404, detail="Cor não encontrada")
    
    db.delete(db_color)
    db.commit()


# ============= MATERIALS =============

@router.get("/materials", response_model=list[MaterialResponse])
async def list_materials(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Lista todos os materiais (público)
    """
    materials = db.query(Material).filter(Material.is_active == True).offset(skip).limit(limit).all()
    return materials


@router.get("/materials/{material_id}", response_model=MaterialResponse)
async def get_material(
    material_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtém um material específico pelo ID
    """
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado")
    return material


@router.post("/materials", response_model=MaterialResponse)
async def create_material(
    material: MaterialCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Cria um novo material (requer admin)
    """
    # Verifica se já existe material com mismo slug
    existing = db.query(Material).filter(Material.slug == material.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Material com este slug já existe")
    
    db_material = Material(**material.dict())
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material


@router.put("/materials/{material_id}", response_model=MaterialResponse)
async def update_material(
    material_id: int,
    material_data: MaterialUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Atualiza um material (requer admin)
    """
    db_material = db.query(Material).filter(Material.id == material_id).first()
    if not db_material:
        raise HTTPException(status_code=404, detail="Material não encontrado")
    
    # Verifica se novo slug já existe
    if material_data.slug:
        existing = db.query(Material).filter(
            Material.slug == material_data.slug,
            Material.id != material_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Slug já existe para outro material")
    
    update_data = material_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_material, key, value)
    
    db.commit()
    db.refresh(db_material)
    return db_material


@router.delete("/materials/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material(
    material_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Deleta um material (requer admin)
    """
    db_material = db.query(Material).filter(Material.id == material_id).first()
    if not db_material:
        raise HTTPException(status_code=404, detail="Material não encontrado")
    
    db.delete(db_material)
    db.commit()
