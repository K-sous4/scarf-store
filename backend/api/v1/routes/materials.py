from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models.user import User
from models.material import Material
from schemas.material import MaterialCreate, MaterialUpdate, MaterialResponse
from database.db import get_db
from api.v1.dependencies import get_current_admin
from typing import List

router = APIRouter(prefix="/materials", tags=["materials"])


# ============= PUBLIC =============

@router.get("/", response_model=List[MaterialResponse])
async def list_materials(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Lista todos os materiais ativos (público)
    """
    return db.query(Material).filter(Material.is_active == True).offset(skip).limit(limit).all()


@router.get("/{material_id}", response_model=MaterialResponse)
async def get_material(material_id: int, db: Session = Depends(get_db)):
    """
    Obtém um material pelo ID (público)
    """
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado")
    return material


# ============= ADMIN =============

@router.post("/", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def create_material(
    material: MaterialCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Cria um novo material (admin)
    """
    existing = db.query(Material).filter(Material.slug == material.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Material com este slug já existe")

    db_material = Material(**material.dict())
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material


@router.put("/{material_id}", response_model=MaterialResponse)
async def update_material(
    material_id: int,
    material_data: MaterialUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Atualiza um material (admin)
    """
    db_material = db.query(Material).filter(Material.id == material_id).first()
    if not db_material:
        raise HTTPException(status_code=404, detail="Material não encontrado")

    if material_data.slug:
        existing = db.query(Material).filter(
            Material.slug == material_data.slug,
            Material.id != material_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Slug já existe para outro material")

    for key, value in material_data.dict(exclude_unset=True).items():
        setattr(db_material, key, value)

    db.commit()
    db.refresh(db_material)
    return db_material


@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_material(
    material_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Deleta um material (admin)
    """
    db_material = db.query(Material).filter(Material.id == material_id).first()
    if not db_material:
        raise HTTPException(status_code=404, detail="Material não encontrado")

    db.delete(db_material)
    db.commit()
