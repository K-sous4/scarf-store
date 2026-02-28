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
