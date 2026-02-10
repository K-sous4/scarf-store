from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from enum import Enum
from dotenv import load_dotenv
import logging
from contextlib import asynccontextmanager

# Load .env file
load_dotenv()

# Import models ANTES de criar as tabelas
from models import user, product
from api.v1.public import auth, products
from api.v1.private import users, admin
from database.db import create_tables
from middlewares import AuthenticationMiddleware


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
    Gerencia o ciclo de vida da aplicação (startup e shutdown)
    """
    # Startup
    try:
        create_tables()
        logging.info("✓ Tabelas criadas com sucesso!")
    except Exception as e:
        logging.error(f"✗ Erro ao criar tabelas: {e}")
    
    yield
    
    # Shutdown
    logging.info("Aplicação encerrada")


# Create FastAPI app with appropriate settings
app = FastAPI(
    title="Scarf Store API",
    version="1.0.0",
    debug=(ENVIRONMENT == Environment.DEVELOPMENT),
    lifespan=lifespan
)

# Adicionar middleware de autenticação (nativo do FastAPI)
app.add_middleware(AuthenticationMiddleware)

# Configurar CORS
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:5173",  # Vite default
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:5173",
]

if ENVIRONMENT == Environment.DEVELOPMENT:
    allowed_origins.append("*")  # Permite todos em development

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas públicas
app.include_router(auth.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")

# Incluir rotas privadas (protegidas)
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

