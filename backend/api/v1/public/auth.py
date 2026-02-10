from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Faz login e retorna um token JWT
    """
    # TODO: Implementar validação de usuário e criação de token
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint ainda não implementado"
    )


@router.post("/register")
async def register(email: str, password: str):
    """
    Registra um novo usuário
    """
    # TODO: Implementar registro de usuário
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint ainda não implementado"
    )
