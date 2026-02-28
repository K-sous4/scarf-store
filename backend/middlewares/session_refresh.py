from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from services.session import session_manager

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
    Middleware to extend session TTL on every authenticated request.
    Keeps the session alive as long as the user is active.
    """

    async def dispatch(self, request: Request, call_next):
        """
        Process request and extend session TTL if user is authenticated.
        """
        response = await call_next(request)

        # Skip refresh for certain paths
        if request.url.path in SKIP_REFRESH_PATHS:
            return response

        # Skip if response is not successful
        if response.status_code >= 400:
            return response

        # Get session ID from request cookies
        session_id = request.cookies.get(COOKIE_NAME)

        # If user has a valid session, just extend its TTL (no rotation)
        if session_id:
            session_manager.refresh_session(session_id)

        return response
