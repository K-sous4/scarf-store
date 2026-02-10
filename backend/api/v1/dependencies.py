from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from models.user import User
from database.db import get_db


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """
    Dependência para obter o usuário autenticado.
    O middleware extrai o token e adiciona user_id ao request.state.
    Esta dependência valida que o token foi fornecido e é válido.
    """
    user_id = getattr(request.state, "user_id", None)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token não fornecido ou inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
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
