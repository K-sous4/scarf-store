from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from database.db import get_db
from services.product import ProductService
from api.v1.schemas.product import ProductResponse

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/")
async def list_products(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
):
    """
    Lista todos os produtos disponíveis (apenas ativos)
    """
    products, total = ProductService.list_products(
        db,
        skip=skip,
        limit=limit,
        active_only=True,  # Only show active products in public endpoint
    )
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "products": [ProductResponse.model_validate(p) for p in products]
    }


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """
    Obtém detalhes de um produto específico (apenas se ativo)
    """
    product = ProductService.get_product(db, product_id)
    if not product or not product.is_active:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )
    return product
