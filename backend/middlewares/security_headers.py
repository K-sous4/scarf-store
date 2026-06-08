from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

STRIP_RESPONSE_HEADERS = frozenset(
    {
        "server",
        "x-powered-by",
        "x-render-origin-server",
        "rndr-id",
        "x-render-routing",
    }
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Remove headers que expõem stack e adiciona proteções básicas."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        for name in list(response.headers.keys()):
            if name.lower() in STRIP_RESPONSE_HEADERS:
                del response.headers[name]

        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("X-Frame-Options", "DENY")

        return response
