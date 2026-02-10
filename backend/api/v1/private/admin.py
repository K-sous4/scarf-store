from fastapi import APIRouter, Depends
from models.user import User
from api.v1.dependencies import get_current_admin
from sqlalchemy.orm import Session
from database.db import get_db

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
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role
            }
            for u in users
        ]
    }
