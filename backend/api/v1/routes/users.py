from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models.user import User
from database.db import get_db
from api.v1.dependencies import get_current_user, get_current_admin
from api.v1.schemas.address import user_has_complete_shipping_address
import re

from utils.security import hash_password, verify_password
from services.session import session_manager
from pydantic import BaseModel, EmailStr, Field
from typing import Literal

router = APIRouter(prefix="/users", tags=["users"])


class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: str | None
    role: str
    full_name: str | None = None
    phone: str | None = None
    postal_code: str | None = None
    street: str | None = None
    number: str | None = None
    complement: str | None = None
    neighborhood: str | None = None
    city: str | None = None
    state: str | None = None
    has_shipping_address: bool = False

    class Config:
        from_attributes = True


def _profile_response(user: User) -> UserProfileResponse:
    data = UserProfileResponse.model_validate(user)
    return data.model_copy(
        update={"has_shipping_address": user_has_complete_shipping_address(user)}
    )


class UserMeUpdateRequest(BaseModel):
    username: str | None = Field(None, min_length=3, max_length=50)
    email: EmailStr | None = None
    full_name: str | None = Field(None, max_length=120)
    phone: str | None = Field(None, max_length=20)
    postal_code: str | None = Field(None, max_length=9)
    street: str | None = Field(None, max_length=200)
    number: str | None = Field(None, max_length=20)
    complement: str | None = Field(None, max_length=80)
    neighborhood: str | None = Field(None, max_length=100)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=2)
    current_password: str | None = Field(None, min_length=6, max_length=128)
    new_password: str | None = Field(None, min_length=6, max_length=128)


class AdminCreateUserRequest(BaseModel):
    username: str
    password: str
    email: EmailStr | None = None
    role: Literal["user", "admin"] = "user"


class AdminUpdateUserRequest(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    password: str | None = None
    role: Literal["user", "admin"] | None = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str | None
    role: str

    class Config:
        from_attributes = True


def _normalize_optional_state(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip().upper()
    if len(cleaned) != 2:
        raise HTTPException(status_code=400, detail="UF invalida")
    return cleaned


# ============= AUTHENTICATED USER =============

@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """
    Retorna o perfil do usuário autenticado
    """
    return _profile_response(current_user)


@router.put("/me", response_model=UserProfileResponse)
async def update_my_profile(
    request: UserMeUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Atualiza o perfil do usuário autenticado
    """
    if request.new_password:
        if not request.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Informe a senha atual para alterar a senha",
            )
        if not verify_password(request.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Senha atual incorreta",
            )
        current_user.hashed_password = hash_password(request.new_password)

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

    if request.email is not None:
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

    if request.full_name is not None:
        current_user.full_name = request.full_name.strip() or None
    if request.phone is not None:
        current_user.phone = request.phone.strip() or None
    if request.postal_code is not None:
        raw = request.postal_code.strip()
        if not raw:
            current_user.postal_code = None
        else:
            digits = re.sub(r"\D", "", raw)
            if len(digits) != 8:
                raise HTTPException(status_code=400, detail="CEP deve ter 8 digitos")
            current_user.postal_code = f"{digits[:5]}-{digits[5:]}"
    if request.street is not None:
        current_user.street = request.street.strip() or None
    if request.number is not None:
        current_user.number = request.number.strip() or None
    if request.complement is not None:
        current_user.complement = request.complement.strip() or None
    if request.neighborhood is not None:
        current_user.neighborhood = request.neighborhood.strip() or None
    if request.city is not None:
        current_user.city = request.city.strip() or None
    if request.state is not None:
        current_user.state = _normalize_optional_state(request.state) if request.state.strip() else None

    security_sensitive = bool(request.new_password)
    db.commit()
    db.refresh(current_user)
    if security_sensitive:
        session_manager.invalidate_sessions_for_user(current_user.id)
    return _profile_response(current_user)


# ============= ADMIN =============

@router.get("", response_model=dict)
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


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: AdminCreateUserRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Cria um novo usuário (admin)
    """
    if db.query(User).filter(User.username == request.username).first():
        raise HTTPException(status_code=400, detail="Username já está em uso")
    if request.email and db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email já está em uso")

    user = User(
        username=request.username,
        email=request.email,
        hashed_password=hash_password(request.password),
        role=request.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


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


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    request: AdminUpdateUserRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Atualiza um usuário (admin)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if request.username and request.username != user.username:
        if db.query(User).filter(User.username == request.username).first():
            raise HTTPException(status_code=400, detail="Username já está em uso")
        user.username = request.username

    if request.email and request.email != user.email:
        if db.query(User).filter(User.email == request.email).first():
            raise HTTPException(status_code=400, detail="Email já está em uso")
        user.email = request.email

    security_sensitive = False
    if request.password:
        user.hashed_password = hash_password(request.password)
        security_sensitive = True

    if request.role:
        user.role = request.role
        security_sensitive = True

    db.commit()
    db.refresh(user)
    if security_sensitive:
        session_manager.invalidate_sessions_for_user(user.id)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Deleta um usuário (admin). Não é possível deletar admins.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Não é possível deletar um administrador")
    session_manager.invalidate_sessions_for_user(user.id)
    db.delete(user)
    db.commit()
