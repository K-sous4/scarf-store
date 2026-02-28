from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from enum import Enum
from dotenv import load_dotenv
import logging
from contextlib import asynccontextmanager

# Load .env file
load_dotenv()

# Import models BEFORE creating tables
from models import user, product, category, color, material, audit_log
from api.v1.routes import auth, products, categories, colors, materials, users
from database.db import create_tables, SessionLocal
from database.seed import seed_admin
from database.mockup import seed_mockup
from middlewares.session_refresh import SessionRefreshMiddleware
from middlewares.logging import AuditLoggingMiddleware


# Define environment modes
class Environment(str, Enum):
    DEVELOPMENT = "development"
    RELEASE = "release"


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
        logging.info("✓ Tables created successfully!")
    except Exception as e:
        logging.error(f"✗ Error creating tables: {e}")

    try:
        db = SessionLocal()
        seed_admin(db)
        if ENVIRONMENT == Environment.DEVELOPMENT:
            seed_mockup(db)
        db.close()
    except Exception as e:
        logging.error(f"✗ Error seeding: {e}")
    
    yield
    
    # Shutdown
    logging.info("Application shutdown")


# Create FastAPI app with appropriate settings
app = FastAPI(
    title="Scarf Store API",
    version="1.0.0",
    debug=(ENVIRONMENT == Environment.DEVELOPMENT),
    lifespan=lifespan
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
app.add_middleware(AuditLoggingMiddleware)  # Audit logging (outermost)
app.add_middleware(SessionRefreshMiddleware)  # Refreshes session cookies

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


@app.get("/ping")
def pong():
    return {
        "msg": "pong",
        "mode": ENVIRONMENT
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "environment": ENVIRONMENT
    }

