from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from models.user import User
from database.db import get_db
from services.product import ProductService
from api.v1.dependencies import get_current_admin
from api.v1.schemas.product import ProductCreateRequest, ProductUpdateRequest, ProductResponse

router = APIRouter(prefix="/products", tags=["products"])


# ============= PUBLIC =============

@router.get("/", response_model=dict)
async def list_products(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
):
    """
    Lista todos os produtos ativos (público)
    """
    products, total = ProductService.list_products(db, skip=skip, limit=limit, active_only=True)
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "products": [ProductResponse.model_validate(p) for p in products]
    }


@router.get("/low-stock", response_model=dict)
async def list_low_stock(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Lista produtos com estoque baixo (admin)
    """
    products = ProductService.check_low_stock(db)
    return {
        "total": len(products),
        "products": [
            {
                "id": p.id,
                "sku": p.sku,
                "name": p.name,
                "available_stock": p.available_stock,
                "low_stock_threshold": p.low_stock_threshold
            }
            for p in products
        ]
    }


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """
    Obtém detalhes de um produto ativo (público)
    """
    product = ProductService.get_product(db, product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    return product


# ============= ADMIN =============

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreateRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Cria um novo produto (admin)
    """
    try:
        return ProductService.create_product(db, product_data.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/admin/all", response_model=dict)
async def list_all_products_admin(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    category: str = Query(None),
    active_only: bool = Query(False)
):
    """
    Lista todos os produtos incluindo inativos (admin)
    """
    products, total = ProductService.list_products(
        db, skip=skip, limit=limit, active_only=active_only, category=category
    )
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "products": [ProductResponse.model_validate(p) for p in products]
    }


@router.get("/admin/{product_id}", response_model=ProductResponse)
async def get_product_admin(
    product_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Obtém detalhes completos de um produto, incluindo inativo (admin)
    """
    product = ProductService.get_product(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto {product_id} não encontrado"
        )
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdateRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Atualiza um produto (admin)
    """
    update_data = {k: v for k, v in product_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhum campo para atualizar foi fornecido"
        )
    try:
        product = ProductService.update_product(db, product_id, update_data)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Produto {product_id} não encontrado"
            )
        return product
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Deleta um produto (admin)
    """
    if not ProductService.delete_product(db, product_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto {product_id} não encontrado"
        )


@router.post("/{product_id}/stock", response_model=ProductResponse)
async def update_product_stock(
    product_id: int,
    stock_data: dict,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Atualiza o estoque de um produto (admin)

    Body: { "quantity": 10, "operation": "add" | "remove" }
    """
    quantity = stock_data.get("quantity")
    operation = stock_data.get("operation", "add")

    if quantity is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campo 'quantity' é obrigatório"
        )
    try:
        product = ProductService.update_stock(db, product_id, quantity, operation)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Produto {product_id} não encontrado"
            )
        return product
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{product_id}/low-stock", response_model=dict)
async def check_product_low_stock(
    product_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Verifica se um produto está com estoque baixo (admin)
    """
    product = ProductService.get_product(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto {product_id} não encontrado"
        )
    return {
        "product_id": product_id,
        "sku": product.sku,
        "name": product.name,
        "available_stock": product.available_stock,
        "low_stock_threshold": product.low_stock_threshold,
        "is_low_stock": product.available_stock <= product.low_stock_threshold
    }
