from fastapi import APIRouter, Depends
from api.v1.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/profile")
async def get_profile(current_user = Depends(get_current_user)):
    """
    Obtém o perfil do usuário autenticado
    """
    return {
        "message": "Perfil do usuário",
        "user_id": current_user["user_id"]
    }


@router.put("/profile")
async def update_profile(current_user = Depends(get_current_user)):
    """
    Atualiza o perfil do usuário autenticado
    """
    return {
        "message": "Perfil atualizado",
        "user_id": current_user["user_id"]
    }
