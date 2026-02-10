from fastapi import APIRouter, HTTPException, status, Depends, Request, Response
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from models.user import User
from utils.security import hash_password, verify_password
from utils.cookies import set_session_cookie, refresh_session_cookie, COOKIE_NAME
from database.db import get_db
from services.session import session_manager
from services.csrf import csrf_protection

router = APIRouter(prefix="/auth", tags=["auth"])


class SignUpRequest(BaseModel):
    username: str
    password: str
    email: EmailStr | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    message: str
    csrf_token: str


class LogoutResponse(BaseModel):
    message: str


class ProfileResponse(BaseModel):
    id: int
    username: str
    role: str


@router.post("/sign-in", response_model=AuthResponse)
async def sign_in(request: SignUpRequest, response: Response, db: Session = Depends(get_db)):
    """
    Register a new user and create a secure session cookie
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        # Generic error message to prevent username enumeration
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed"
        )
    
    # Create new user
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
    
    # Create session
    session_id = session_manager.create_session(
        user_id=new_user.id,
        username=new_user.username,
        role=new_user.role
    )
    
    # Generate CSRF token
    csrf_token = csrf_protection.generate_token(session_id)
    
    # Set secure session cookie
    set_session_cookie(response, session_id)
    
    return {"message": "User registered successfully", "csrf_token": csrf_token}


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Authenticate user and create a secure session cookie
    """
    # Find user
    user = db.query(User).filter(User.username == request.username).first()
    
    if not user or not verify_password(request.password, user.hashed_password):
        # Generic error message to prevent username enumeration
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )
    
    # Create session
    session_id = session_manager.create_session(
        user_id=user.id,
        username=user.username,
        role=user.role
    )
    
    # Generate CSRF token
    csrf_token = csrf_protection.generate_token(session_id)
    
    # Set secure session cookie
    set_session_cookie(response, session_id)
    
    return {"message": "Login successful", "csrf_token": csrf_token}


@router.post("/logout", response_model=LogoutResponse)
async def logout(http_request: Request, response: Response):
    """
    Invalidate session and clear session cookie
    """
    session_id = http_request.cookies.get(COOKIE_NAME)
    
    if session_id:
        # Invalidate all CSRF tokens for this session
        csrf_protection.invalidate_all_tokens(session_id)
        # Invalidate session
        session_manager.invalidate_session(session_id)
    
    # Clear session cookie
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        domain=None
    )
    
    return {"message": "Logout successful"}


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(http_request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Get authenticated user's profile using session cookie.
    Returns minimal user information to prevent data leakage.
    Refreshes session cookie on each request.
    """
    session_id = http_request.cookies.get(COOKIE_NAME)
    
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    session_data = session_manager.get_session(session_id)
    
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid"
        )
    
    user = db.query(User).filter(User.id == session_data["user_id"]).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Refresh session TTL on Redis
    session_manager.refresh_session(session_id)
    
    # Refresh session cookie (extends expiration on browser)
    refresh_session_cookie(response, session_id)
    
    return {
        "id": user.id,
        "username": user.username,
        "role": user.role
    }


