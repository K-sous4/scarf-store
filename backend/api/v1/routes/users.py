from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models.user import User
from database.db import get_db
from api.v1.dependencies import get_current_user, get_current_admin
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/users", tags=["users"])


class UserUpdateRequest(BaseModel):
    username: str | None = None
    email: EmailStr | None = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str | None
    role: str

    class Config:
        from_attributes = True


# ============= AUTHENTICATED USER =============

@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Retorna o perfil do usuário autenticado
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    request: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Atualiza o perfil do usuário autenticado
    """
    if request.username:
        existing = db.query(User).filter(
            User.username == request.username,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username já está em uso"
            )
        current_user.username = request.username

    if request.email:
        existing = db.query(User).filter(
            User.email == request.email,
            User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já está em uso"
            )
        current_user.email = request.email

    db.commit()
    db.refresh(current_user)
    return current_user


# ============= ADMIN =============

@router.get("/", response_model=dict)
async def list_users(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Lista todos os usuários (admin)
    """
    users = db.query(User).all()
    return {
        "total": len(users),
        "users": [
            {"id": u.id, "username": u.username, "email": u.email, "role": u.role}
            for u in users
        ]
    }


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Obtém um usuário pelo ID (admin)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user
