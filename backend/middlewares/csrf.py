from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from services.csrf import csrf_protection

COOKIE_NAME = "session_id"

# HTTP methods that require CSRF protection
PROTECTED_METHODS = {"POST", "PUT", "DELETE", "PATCH"}


class CSRFMiddleware(BaseHTTPMiddleware):
    """
    CSRF protection middleware.
    Validates CSRF tokens on state-changing requests.
    """

    async def dispatch(self, request: Request, call_next):
        """
        Check CSRF token for protected HTTP methods.
        """
        if request.method in PROTECTED_METHODS:
            # Skip CSRF validation for public endpoints and logout
            # Public endpoints: login, sign-in (create sessions without auth)
            # Logout: destroys session, doesn't need CSRF protection
            if request.url.path in ["/api/v1/auth/login", "/api/v1/auth/sign-in", "/api/v1/auth/logout"]:
                return await call_next(request)
            
            session_id = request.cookies.get(COOKIE_NAME)
            
            # If no session, let the endpoint handle authentication
            if not session_id:
                return await call_next(request)
            
            # Get CSRF token from request
            csrf_token = None
            
            # Try to get from header first (X-CSRF-Token)
            csrf_token = request.headers.get("X-CSRF-Token")
            
            # If not in header, try form data
            if not csrf_token and request.method in {"POST", "PUT", "DELETE", "PATCH"}:
                try:
                    # For JSON requests
                    if "application/json" in request.headers.get("content-type", ""):
                        body = await request.json()
                        csrf_token = body.get("csrf_token")
                    # For form data
                    else:
                        form = await request.form()
                        csrf_token = form.get("csrf_token")
                except Exception:
                    pass
            
            # Validate CSRF token
            if not csrf_token or not csrf_protection.validate_token(csrf_token, session_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CSRF token invalid or missing"
                )
        
        return await call_next(request)
