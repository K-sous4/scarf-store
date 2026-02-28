from fastapi import APIRouter, HTTPException, status, Depends, Request, Response
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from models.user import User
from utils.security import hash_password, verify_password
from utils.cookies import set_session_cookie, refresh_session_cookie, COOKIE_NAME
from database.db import get_db
from services.session import session_manager
from services.logging_service import LoggingService
import logging

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


class SignUpRequest(BaseModel):
    username: str
    password: str
    email: EmailStr | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    user: "ProfileResponse"


class LogoutResponse(BaseModel):
    message: str


class ProfileResponse(BaseModel):
    id: int
    username: str
    role: str


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

    hashed_password = hash_password(request.password)
    new_user = User(
        username=request.username,
        email=request.email,
        hashed_password=hashed_password,
        role="user"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    session_id = session_manager.create_session(
        user_id=new_user.id,
        username=new_user.username,
        role=new_user.role
    )
    set_session_cookie(response, session_id)

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

    response.delete_cookie(key=COOKIE_NAME, path="/", domain=None)
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

    session_manager.refresh_session(session_id)
    refresh_session_cookie(response, session_id)

    return {"id": user.id, "username": user.username, "role": user.role}
