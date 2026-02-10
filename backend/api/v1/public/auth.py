from fastapi import APIRouter, HTTPException, status, Depends, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from models.user import User
from services.auth import create_access_token
from utils.security import hash_password, verify_password
from database.db import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class LogoutResponse(BaseModel):
    message: str


class ProfileResponse(BaseModel):
    id: int
    email: str
    full_name: str | None


@router.post("/sign-in", response_model=LoginResponse)
async def sign_in(request: SignUpRequest, db: Session = Depends(get_db)):
    """
    Registra um novo usuário e retorna um token JWT
    """
    # Verificar se usuário já existe
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já registrado"
        )
    
    # Criar novo usuário
    hashed_password = hash_password(request.password)
    new_user = User(
        email=request.email,
        hashed_password=hashed_password,
        full_name=request.full_name or request.email.split("@")[0],
        role="user"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Criar token
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name
        }
    }


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Faz login e retorna um token JWT
    """
    # Buscar usuário
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha inválidos"
        )
    
    # Criar token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    }


@router.post("/logout", response_model=LogoutResponse)
async def logout(http_request: Request):
    """
    Faz logout (no backend é apenas uma confirmação)
    O token deve ser removido no frontend
    """
    auth_header = http_request.headers.get("Authorization")
    
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token não fornecido"
        )
    
    # O logout real seria implementado com blacklist de tokens se necessário
    return {"message": "Logout realizado com sucesso. Remova o token no cliente."}


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(http_request: Request, db: Session = Depends(get_db)):
    """
    Obtém o perfil do usuário autenticado.
    O middleware já validou o token e adicionou user_id ao request.state
    """
    user_id = getattr(http_request.state, "user_id", None)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não autenticado"
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name
    }

