import os
from enum import Enum
from dotenv import load_dotenv

load_dotenv()


class Environment(str, Enum):
    DEVELOPMENT = "development"
    RELEASE = "release"


# Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", Environment.DEVELOPMENT).lower()
DEBUG = ENVIRONMENT == Environment.DEVELOPMENT

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://scarf_user:scarf_password@localhost:5432/scarf_store_db")

# Server
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", 8000))

# JWT
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password reset
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
PASSWORD_RESET_TTL_SECONDS = int(os.getenv("PASSWORD_RESET_TTL_SECONDS", "3600"))

# SMTP (opcional — sem configuracao o link e registrado nos logs)
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() in ("1", "true", "yes")

# Pedidos pendentes (pagamento nao concluido)
PENDING_ORDER_EXPIRE_HOURS = int(os.getenv("PENDING_ORDER_EXPIRE_HOURS", "48"))
ORDER_EXPIRY_CHECK_MINUTES = int(os.getenv("ORDER_EXPIRY_CHECK_MINUTES", "15"))
