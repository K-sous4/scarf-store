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
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_username VARCHAR(255)",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(255)",
        "ALTER TABLE payment_settings ADD COLUMN IF NOT EXISTS delivery_commitment_days INTEGER DEFAULT 7",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(120)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(9)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS street VARCHAR(200)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS number VARCHAR(20)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS complement VARCHAR(80)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(2)",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_recipient_name VARCHAR(120)",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_phone VARCHAR(20)",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_postal_code VARCHAR(9)",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_street VARCHAR(200)",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_number VARCHAR(20)",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_complement VARCHAR(80)",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_neighborhood VARCHAR(100)",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100)",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(2)",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_formatted VARCHAR(500)",
        "ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL",
    ]
    fk_statements = [
        "ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey",
        """ALTER TABLE order_items ADD CONSTRAINT order_items_product_id_fkey
           FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL""",
    ]
    backfill = """
        UPDATE orders o
        SET buyer_username = u.username,
            buyer_email = u.email
        FROM users u
        WHERE o.user_id = u.id
          AND o.buyer_username IS NULL
    """
    try:
        with engine.begin() as conn:
            for sql in statements:
                conn.execute(text(sql))
            for sql in fk_statements:
                try:
                    conn.execute(text(sql))
                except Exception as fk_exc:
                    logger.warning("ensure_order_columns fk: %s", fk_exc)
            conn.execute(text(backfill))
    except Exception as exc:
        logger.warning("ensure_order_columns: %s", exc)
