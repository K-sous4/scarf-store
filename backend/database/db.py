from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from config.settings import DATABASE_URL
import logging

logger = logging.getLogger(__name__)

# Base para modelos (declarado ANTES de criar o engine)
Base = declarative_base()

# Criar engine de banco de dados
engine = create_engine(DATABASE_URL, echo=True)

# Criar SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """
    Dependência para obter sessão do banco de dados
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """
    Cria todas as tabelas no banco de dados
    """
    Base.metadata.create_all(bind=engine)


def ensure_order_columns():
    """Adiciona colunas novas em orders em bancos já existentes (sem Alembic)."""
    statements = [
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS terms_version VARCHAR(20)",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_note VARCHAR(255)",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_by_admin_id INTEGER REFERENCES users(id)",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_by_admin_id INTEGER REFERENCES users(id)",
    ]
    try:
        with engine.begin() as conn:
            for sql in statements:
                conn.execute(text(sql))
    except Exception as exc:
        logger.warning("ensure_order_columns: %s", exc)
