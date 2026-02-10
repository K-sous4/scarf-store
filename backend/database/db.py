from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from config.settings import DATABASE_URL

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
