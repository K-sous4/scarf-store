from fastapi import APIRouter, HTTPException, status, Depends, Request, Response, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from models.user import User
from utils.security import hash_password, verify_password
from services.password_reset import password_reset_service
from services.email_service import build_password_reset_url, send_password_reset_email
from utils.cookies import (
    set_session_cookie,
    set_user_role_cookie,
    refresh_session_cookie,
    clear_auth_cookies,
    COOKIE_NAME,
)
from database.db import get_db
from services.session import session_manager
from services.logging_service import LoggingService
import logging

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


class SignUpRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=128)
    email: EmailStr | None = None


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=128)


class AuthResponse(BaseModel):
    user: "ProfileResponse"


class LogoutResponse(BaseModel):
    message: str


class ProfileResponse(BaseModel):
    id: int
    username: str
    role: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=20, max_length=128)
    new_password: str = Field(..., min_length=6, max_length=128)


class ResetPasswordValidateResponse(BaseModel):
    valid: bool


class MessageResponse(BaseModel):
    message: str


FORGOT_PASSWORD_MESSAGE = (
    "Se o e-mail estiver cadastrado, enviaremos instrucoes para redefinir a senha."
)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    http_request: Request,
    db: Session = Depends(get_db),
):
    """
    Solicita redefinicao de senha por e-mail. Resposta generica para evitar enumeracao.
    """
    ip_address = http_request.client.host if http_request.client else None
    email = request.email.strip().lower()

    if not password_reset_service.is_rate_limited(email, ip_address):
        user = (
            db.query(User)
            .filter(func.lower(User.email) == email, User.email.isnot(None))
            .first()
        )
        if user:
            token = password_reset_service.create_token(user.id)
            reset_url = build_password_reset_url(token)
            send_password_reset_email(user.email, reset_url)

    return {"message": FORGOT_PASSWORD_MESSAGE}


@router.get("/reset-password/validate", response_model=ResetPasswordValidateResponse)
async def validate_reset_password_token(token: str = Query(..., min_length=20, max_length=128)):
    user_id = password_reset_service.peek_user_id(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Link de recuperacao invalido ou expirado",
        )
    return {"valid": True}


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    user_id = password_reset_service.consume_token(request.token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Link de recuperacao invalido ou expirado",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Link de recuperacao invalido ou expirado",
        )

    user.hashed_password = hash_password(request.new_password)
    db.commit()
    session_manager.invalidate_sessions_for_user(user.id)

    return {"message": "Senha redefinida com sucesso. Faca login com a nova senha."}


@router.post("/sign-in", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def sign_in(request: SignUpRequest, response: Response, db: Session = Depends(get_db)):
    """
    Registra um novo usuário e inicia uma sessão
    """
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed"
        )

    if request.email:
        existing_email = db.query(User).filter(User.email == request.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed",
            )

    hashed_password = hash_password(request.password)
    new_user = User(
        username=request.username,
        email=request.email,
        hashed_password=hashed_password,
        role="user"
    )

    db.add(new_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed",
        )
    db.refresh(new_user)

    session_id = session_manager.create_session(
        user_id=new_user.id,
        username=new_user.username,
        role=new_user.role
    )
    set_session_cookie(response, session_id)
    set_user_role_cookie(response, new_user.role)

    return {
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "role": new_user.role
        }
    }


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, response: Response, http_request: Request, db: Session = Depends(get_db)):
    """
    Autentica o usuário e inicia uma sessão via cookie seguro
    """
    ip_address = http_request.client.host if http_request.client else None
    user_agent = http_request.headers.get("user-agent", "")

    failed_attempts = LoggingService.get_auth_failed_attempts(db, request.username, minutes=15)
    if len(failed_attempts) >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Try again later.",
        )

    user = db.query(User).filter(User.username == request.username).first()

    if not user or not verify_password(request.password, user.hashed_password):
        LoggingService.log_auth_failure(
            db=db,
            username=request.username,
            ip_address=ip_address,
            user_agent=user_agent,
            error_message="Invalid credentials"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

    session_id = session_manager.create_session(
        user_id=user.id,
        username=user.username,
        role=user.role
    )
    set_session_cookie(response, session_id)
    set_user_role_cookie(response, user.role)

    LoggingService.log_auth_success(
        db=db,
        user_id=user.id,
        username=user.username,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    logger.info(f"✓ User '{user.username}' (ID: {user.id}) logged in from {ip_address}")

    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    }


@router.post("/logout", response_model=LogoutResponse)
async def logout(http_request: Request, response: Response):
    """
    Invalida a sessão e limpa o cookie
    """
    session_id = http_request.cookies.get(COOKIE_NAME)
    if session_id:
        session_manager.invalidate_session(session_id)

    clear_auth_cookies(response)
    return {"message": "Logout successful"}


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(http_request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Retorna os dados do usuário autenticado e renova a sessão
    """
    session_id = http_request.cookies.get(COOKIE_NAME)
    if not session_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    session_data = session_manager.get_session(session_id)
    if not session_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired or invalid")

    user = db.query(User).filter(User.id == session_data["user_id"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    refresh_session_cookie(response, session_id)
    set_user_role_cookie(response, user.role)

    return {"id": user.id, "username": user.username, "role": user.role}
