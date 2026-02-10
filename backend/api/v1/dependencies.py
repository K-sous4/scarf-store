from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from models.user import User
from database.db import get_db
from middlewares.authentication import AuthenticationMiddleware


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """
    Dependência para obter o usuário autenticado.
    Extrai e valida o token JWT apenas quando chamada (não global).
    """
    # Extrair token do header
    token = AuthenticationMiddleware._extract_token(request)
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token não fornecido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Validar token
    user_id = AuthenticationMiddleware._validate_token(token)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Buscar usuário no banco
    user = db.query(User).filter(User.id == int(user_id)).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependência para obter um usuário admin.
    Valida se o usuário tem role 'admin'.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Privilégios de administrador necessários."
        )
    
    return current_user
