import os
import logging
from sqlalchemy.orm import Session
from models.user import User
from utils.security import hash_password

logger = logging.getLogger(__name__)

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", None)


def seed_admin(db: Session) -> None:
    """
    Creates a default admin user if none exists.
    Credentials are controlled via environment variables:
      ADMIN_USERNAME  (default: admin)
      ADMIN_PASSWORD  (default: admin123)
      ADMIN_EMAIL     (optional)
    """
    existing = db.query(User).filter(User.role == "admin").first()
    if existing:
        logger.info(f"✓ Admin user already exists: '{existing.username}'")
        return

    admin = User(
        username=ADMIN_USERNAME,
        email=ADMIN_EMAIL,
        hashed_password=hash_password(ADMIN_PASSWORD),
        role="admin",
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    logger.info(f"✓ Admin user created: '{admin.username}' (id={admin.id})")
