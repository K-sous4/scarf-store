from fastapi import FastAPI
import os
from enum import Enum
from dotenv import load_dotenv
import logging

# Import rotas
from api.v1.public import auth, products
from api.v1.private import users, admin
from database.db import create_tables


# Load .env file
load_dotenv()

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


# Create FastAPI app with appropriate settings
app = FastAPI(
    title="Scarf Store API",
    version="1.0.0",
    debug=(ENVIRONMENT == Environment.DEVELOPMENT)
)

# Criar tabelas do banco de dados
create_tables()

# Incluir rotas públicas
app.include_router(auth.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")

# Incluir rotas privadas (protegidas)
app.include_router(users.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "environment": ENVIRONMENT
    }

