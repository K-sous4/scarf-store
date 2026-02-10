from fastapi import APIRouter, Depends
from api.v1.dependencies import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
async def get_dashboard(current_user = Depends(get_current_user)):
    """
    Painel administrativo (requer autenticação)
    """
    return {
        "message": "Bem-vindo ao painel admin",
        "user_id": current_user["user_id"]
    }
