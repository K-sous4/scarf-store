from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.user import User
from database.db import get_db
from api.v1.dependencies import get_current_user
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


@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """
    Obtém o perfil do usuário autenticado
    """
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    request: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Atualiza o perfil do usuário autenticado
    """
    if request.username:
        # Verificar se username já existe
        existing_user = db.query(User).filter(
            User.username == request.username,
            User.id != current_user.id
        ).first()
        
        if existing_user:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username já está em uso"
            )
        
        current_user.username = request.username
    
    if request.email:
        # Verificar se email já existe
        existing_user = db.query(User).filter(
            User.email == request.email,
            User.id != current_user.id
        ).first()
        
        if existing_user:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já está em uso"
            )
        
        current_user.email = request.email
    
    db.commit()
    db.refresh(current_user)
    
    return current_user
