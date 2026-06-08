from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from enum import Enum
from dotenv import load_dotenv
import logging
import asyncio
from contextlib import asynccontextmanager

# Load .env file
load_dotenv()

# Import models BEFORE creating tables
from models import user, product, product_image, category, color, material, audit_log, payment_settings, order
from api.v1.routes import auth, products, categories, colors, materials, users, payment_settings, orders
from database.db import create_tables, ensure_order_columns, SessionLocal
from database.seed import seed_admin
from database.mockup import seed_mockup
from services.order_expiry import expire_stale_pending_orders, order_expiry_loop
from middlewares.session_refresh import SessionRefreshMiddleware
from middlewares.session_state import SessionStateMiddleware
from middlewares.logging import AuditLoggingMiddleware
from middlewares.security_headers import SecurityHeadersMiddleware


# Define environment modes
class Environment(str, Enum):
    DEVELOPMENT = "development"
    RELEASE = "release"
    TEST = "test"


# Get environment from .env or system variable (default to development)
ENVIRONMENT = os.getenv("ENVIRONMENT", Environment.DEVELOPMENT).lower()

# Configure logging based on environment
if ENVIRONMENT == Environment.RELEASE:
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
else:
    logging.getLogger("uvicorn").setLevel(logging.DEBUG)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages application lifecycle (startup and shutdown)
    """
    # Startup
    try:
        create_tables()
        ensure_order_columns()
        logging.info("✓ Tables created successfully!")
    except Exception as e:
        logging.error(f"✗ Error creating tables: {e}")

    try:
        from services.session import session_manager

        session_manager.redis_client.ping()
        logging.info("✓ Redis conectado")
    except Exception as e:
        logging.error(f"✗ Redis indisponível (sessões não funcionarão): {e}")

    try:
        db = SessionLocal()
        seed_admin(db)
        seed_catalog = (
            ENVIRONMENT == Environment.DEVELOPMENT
            or os.getenv("SEED_CATALOG", "").lower() in ("1", "true", "yes")
            or (
                ENVIRONMENT == Environment.RELEASE
                and db.query(product.Product).count() == 0
            )
        )
        if seed_catalog:
            seed_mockup(db)
        expired = expire_stale_pending_orders(db)
        if expired:
            logging.info("✓ %d pedido(s) pendente(s) expirado(s) na inicializacao", expired)
        db.close()
    except Exception as e:
        logging.error(f"✗ Error seeding: {e}")

    stop_expiry = asyncio.Event()
    expiry_task = asyncio.create_task(order_expiry_loop(stop_expiry))

    yield

    stop_expiry.set()
    expiry_task.cancel()
    try:
        await expiry_task
    except asyncio.CancelledError:
        pass
    logging.info("Application shutdown")


_is_dev = ENVIRONMENT == Environment.DEVELOPMENT

# Create FastAPI app with appropriate settings
app = FastAPI(
    title="Scarf Store API",
    version="1.0.0",
    debug=_is_dev,
    lifespan=lifespan,
    redirect_slashes=False,
    docs_url="/docs" if _is_dev else None,
    redoc_url="/redoc" if _is_dev else None,
    openapi_url="/openapi.json" if _is_dev else None,
)

# Configure CORS
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")

# If "*" or development, accept all
if allowed_origins_env == "*":
    allowed_origins = ["*"]
elif ENVIRONMENT == Environment.DEVELOPMENT:
    # In development, allow localhost on various ports
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]
else:
    # Split by comma and remove whitespace
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",")]

# Add middlewares in the correct order (added REVERSE - last added is executed first)
# Order of execution: AuditLogging -> SessionRefresh -> CORS
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(SessionStateMiddleware)
app.add_middleware(AuditLoggingMiddleware)
app.add_middleware(SessionRefreshMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(colors.router, prefix="/api/v1")
app.include_router(materials.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(payment_settings.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")


@app.get("/ping")
def pong():
    if _is_dev:
        return {"msg": "pong", "mode": ENVIRONMENT}
    return {"msg": "pong"}


@app.get("/health")
def health():
    if _is_dev:
        return {"status": "healthy", "environment": ENVIRONMENT}
    return {"status": "healthy"}

