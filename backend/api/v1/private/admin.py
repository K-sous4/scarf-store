from fastapi import APIRouter, Depends, HTTPException, Query, status
from models.user import User
from models.product import Product
from api.v1.dependencies import get_current_admin
from api.v1.schemas.product import ProductCreateRequest, ProductUpdateRequest, ProductResponse
from sqlalchemy.orm import Session
from database.db import get_db
from services.product import ProductService
from typing import List

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
async def get_dashboard(current_admin: User = Depends(get_current_admin)):
    """
    Painel administrativo (requer role admin)
    """
    return {
        "message": "Bem-vindo ao painel admin",
        "user": {
            "id": current_admin.id,
            "email": current_admin.email,
            "role": current_admin.role
        }
    }


@router.get("/users")
async def list_users(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Lista todos os usuários (apenas admin)
    """
    users = db.query(User).all()
    return {
        "total": len(users),
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "role": u.role
            }
            for u in users
        ]
    }


# ============================================================================
# Rotas de Gerenciamento de Produtos
# ============================================================================

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreateRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Cria um novo produto (apenas admin)
    
    Requer:
    - Autenticação de admin
    - CSRF token válido
    """
    try:
        product = ProductService.create_product(db, product_data.model_dump())
        return product
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/products", response_model=dict)
async def list_admin_products(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    category: str = Query(None),
    active_only: bool = Query(False)
):
    """
    Lista produtos no painel admin (com opção de mostrar inativos)
    """
    products, total = ProductService.list_products(
        db,
        skip=skip,
        limit=limit,
        active_only=active_only,
        category=category
    )
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "products": [ProductResponse.model_validate(p) for p in products]
    }


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product_admin(
    product_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Obtém detalhes completos de um produto (apenas admin)
    """
    product = ProductService.get_product(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto com ID {product_id} não encontrado"
        )
    return product


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdateRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Atualiza um produto (apenas admin)
    
    Requer:
    - Autenticação de admin
    - CSRF token válido
    
    Todos os campos são opcionais - apenas os fornecidos serão atualizados
    """
    try:
        # Remover valores None do dicionário
        update_data = {k: v for k, v in product_data.model_dump().items() if v is not None}
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nenhum campo para atualizar foi fornecido"
            )
        
        product = ProductService.update_product(db, product_id, update_data)
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Produto com ID {product_id} não encontrado"
            )
        
        return product
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Deleta um produto (apenas admin)
    
    Requer:
    - Autenticação de admin
    - CSRF token válido
    """
    if not ProductService.delete_product(db, product_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto com ID {product_id} não encontrado"
        )


@router.get("/products/{product_id}/low-stock", response_model=dict)
async def check_product_low_stock(
    product_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Verifica se um produto está com estoque baixo
    """
    product = ProductService.get_product(db, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto com ID {product_id} não encontrado"
        )
    
    is_low = product.available_stock <= product.low_stock_threshold
    
    return {
        "product_id": product_id,
        "sku": product.sku,
        "name": product.name,
        "available_stock": product.available_stock,
        "low_stock_threshold": product.low_stock_threshold,
        "is_low_stock": is_low
    }


@router.get("/low-stock", response_model=dict)
async def list_low_stock_products(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Lista todos os produtos com estoque baixo
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


@router.post("/products/{product_id}/stock", response_model=ProductResponse)
async def update_product_stock(
    product_id: int,
    stock_data: dict,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Atualiza o estoque de um produto
    
    Body:
    {
        "quantity": 10,
        "operation": "add" ou "remove"
    }
    
    Requer:
    - Autenticação de admin
    - CSRF token válido
    """
    try:
        quantity = stock_data.get('quantity')
        operation = stock_data.get('operation', 'add')
        
        if quantity is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Campo 'quantity' é obrigatório"
            )
        
        product = ProductService.update_stock(db, product_id, quantity, operation)
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Produto com ID {product_id} não encontrado"
            )
        
        return product
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
