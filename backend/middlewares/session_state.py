from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from services.session import session_manager
from utils.cookies import COOKIE_NAME


class SessionStateMiddleware(BaseHTTPMiddleware):
    """Attach authenticated user_id to request.state for downstream middleware."""

    async def dispatch(self, request: Request, call_next):
        session_id = request.cookies.get(COOKIE_NAME)
        if session_id:
            session_data = session_manager.get_session(session_id)
            if session_data:
                request.state.user_id = session_data.get("user_id")
        return await call_next(request)
