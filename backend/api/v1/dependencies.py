from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from models.user import User
from database.db import get_db
from services.session import session_manager

COOKIE_NAME = "session_id"


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get authenticated user from session cookie.
    Validates session and returns user only when called (not global).
    """
    # Extract session ID from cookie
    session_id = request.cookies.get(COOKIE_NAME)
    
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Validate session
    session_data = session_manager.get_session(session_id)
    
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid"
        )
    
    # Get user from database
    user = db.query(User).filter(User.id == session_data["user_id"]).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Refresh session TTL
    session_manager.refresh_session(session_id)
    
    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get admin user.
    Validates that user has 'admin' role.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    return current_user
