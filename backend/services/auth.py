from datetime import datetime, timedelta
from jose import jwt
from config.settings import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from utils.security import hash_password, verify_password


def create_access_token(data: dict):
    """
    Cria um token JWT
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str):
    """
    Verifica e decodifica um token JWT
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except jwt.JWTError:
        return None
