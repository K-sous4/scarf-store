from passlib.context import CryptContext

# Configurar bcrypt com salt rounds (10-12 é recomendado)
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # Salt rounds: quanto maior, mais seguro mas mais lento
)


def hash_password(password: str) -> str:
    """
    Criptografa uma senha com bcrypt e salt.
    O bcrypt gera automaticamente um salt aleatório.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se uma senha corresponde ao hash.
    O bcrypt extrai o salt do hash e o compara.
    """
    return pwd_context.verify(plain_password, hashed_password)
