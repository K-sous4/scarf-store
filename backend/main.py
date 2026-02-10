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
from models import user, product
from api.v1.public import auth, products
from api.v1.private import users, admin
from database.db import create_tables
from middlewares.csrf import CSRFMiddleware
from middlewares.session_refresh import SessionRefreshMiddleware


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
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")

# If "*" or development, accept all
if allowed_origins_env == "*" or ENVIRONMENT == Environment.DEVELOPMENT:
    allowed_origins = ["*"]
else:
    # Split by comma and remove whitespace
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",")]

# Add middlewares in the correct order (added REVERSE - last added is executed first)
# Order of execution: SessionRefresh -> CSRF -> CORS
app.add_middleware(CSRFMiddleware)  # Validates CSRF tokens
app.add_middleware(SessionRefreshMiddleware)  # Refreshes session cookies

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include public routes
app.include_router(auth.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")

# Include private routes (protected)
app.include_router(users.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


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

