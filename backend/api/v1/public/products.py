from fastapi import APIRouter

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/")
async def list_products():
    """
    Lista todos os produtos disponíveis
    """
    return {"products": []}


@router.get("/{product_id}")
async def get_product(product_id: int):
    """
    Obtém detalhes de um produto específico
    """
    return {"product_id": product_id}
