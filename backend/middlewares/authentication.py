from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from jose import JWTError, jwt
from config.settings import SECRET_KEY, ALGORITHM
import logging

logger = logging.getLogger(__name__)


class AuthenticationMiddleware(BaseHTTPMiddleware):
    """
    Middleware HTTP nativo do FastAPI para autenticação JWT.
    Valida tokens Bearer APENAS em rotas protegidas.
    
    O middleware extrai o token do header Authorization e o valida.
    Se válido, adiciona o user_id ao request.state para uso nas rotas.
    Se inválido ou ausente, apenas deixa passar (sem bloquear).
    
    A validação/bloqueio acontece nas dependências das rotas protegidas.
    """
    
    async def dispatch(self, request: Request, call_next):
        """
        Processa a requisição antes de chegar na rota.
        Sempre deixa passar, mas valida token se existir.
        """
        # Tentar extrair e validar token se fornecido
        token = self._extract_token(request)
        
        if token:
            user_id = self._validate_token(token)
            if user_id:
                # Adicionar user_id ao estado da requisição
                request.state.user_id = user_id
        
        # Passar para a próxima rota
        response = await call_next(request)
        return response
    
    @staticmethod
    def _extract_token(request: Request) -> str | None:
        """
        Extrai o token do header Authorization
        
        Formato esperado: Authorization: Bearer <token>
        """
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None
        
        return parts[1]
    
    @staticmethod
    def _validate_token(token: str) -> str | None:
        """
        Valida o token JWT e retorna o user_id
        
        Retorna:
            str | None: user_id se válido, None caso contrário
        """
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            return user_id
        except JWTError as e:
            logger.error(f"Token validation error: {e}")
            return None
