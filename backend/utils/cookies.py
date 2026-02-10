from fastapi import Response

COOKIE_NAME = "session_id"
COOKIE_MAX_AGE = 30 * 60  # 30 minutes


def set_session_cookie(response: Response, session_id: str) -> None:
    """
    Set secure session cookie on response.
    
    Args:
        response: FastAPI Response object
        session_id: Session ID to set in cookie
    """
    response.set_cookie(
        key=COOKIE_NAME,
        value=session_id,
        max_age=COOKIE_MAX_AGE,
        expires=COOKIE_MAX_AGE,
        path="/",
        domain=None,
        secure=False,  # Set to True in production (requires HTTPS)
        httponly=True,  # Prevent JavaScript access
        samesite="strict"  # CSRF protection
    )


def refresh_session_cookie(response: Response, session_id: str) -> None:
    """
    Refresh session cookie by re-setting it with updated expiration.
    Called on each request to extend session lifetime.
    
    Args:
        response: FastAPI Response object
        session_id: Current session ID to refresh
    """
    set_session_cookie(response, session_id)
