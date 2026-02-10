from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from services.session import session_manager
from utils.cookies import refresh_session_cookie

COOKIE_NAME = "session_id"

# Endpoints que não precisam renovar sessão (endpoints públicos)
SKIP_REFRESH_PATHS = {
    "/api/v1/auth/login",
    "/api/v1/auth/sign-in",
    "/api/v1/auth/logout",
    "/ping",
    "/health",
}


class SessionRefreshMiddleware(BaseHTTPMiddleware):
    """
    Middleware to rotate session cookie on every authenticated request.
    Creates a new session ID after each request for maximum security.
    Prevents session fixation attacks.
    """

    async def dispatch(self, request: Request, call_next):
        """
        Process request and rotate session if user is authenticated.
        """
        response = await call_next(request)
        
        # Skip refresh for certain paths
        if request.url.path in SKIP_REFRESH_PATHS:
            return response
        
        # Skip if response is not successful
        if response.status_code >= 400:
            return response
        
        # Get session ID from request cookies
        old_session_id = request.cookies.get(COOKIE_NAME)
        
        # If user has a valid session, rotate it (create new session_id)
        if old_session_id:
            session_data = session_manager.get_session(old_session_id)
            
            if session_data:
                # Rotate session: create new session_id with same user data
                new_session_id = session_manager.rotate_session(
                    old_session_id=old_session_id,
                    user_id=session_data["user_id"],
                    username=session_data["username"],
                    role=session_data["role"]
                )
                
                if new_session_id:
                    # Set new session cookie in response
                    refresh_session_cookie(response, new_session_id)
        
        return response
