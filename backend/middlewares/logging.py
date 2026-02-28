import logging
import time
import json
from typing import Optional
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from sqlalchemy.orm import Session
from database.db import SessionLocal
from services.logging_service import LoggingService

logger = logging.getLogger(__name__)


class AuditLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware que captura e registra todas as requisições HTTP em banco de dados.
    
    Registra:
    - Método HTTP e endpoint
    - Status code da resposta
    - Tempo de resposta
    - IP do cliente
    - User-Agent
    - User ID (se autenticado)
    - Erros
    
    Todos os dados são salvos em tempo real na tabela audit_logs.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Intercepta requisição, chama tratador e registra tudo.
        """
        # Ignorar health checks e métricas
        if request.url.path in ["/health", "/metrics", "/docs", "/openapi.json", "/redoc"]:
            return await call_next(request)

        # Capturar IP do cliente
        ip_address = self._get_client_ip(request)

        # Capturar User-Agent
        user_agent = request.headers.get("user-agent", "")

        # Capturar user_id se autenticado (adicionado por AuthenticationMiddleware)
        user_id = getattr(request.state, "user_id", None)

        # Tempo inicial
        start_time = time.time()

        # Executar requisição
        response = await call_next(request)

        # Calcular tempo de resposta
        response_time_ms = (time.time() - start_time) * 1000

        # Informações da resposta
        status_code = response.status_code
        method = request.method
        endpoint = request.url.path

        # Capturar corpo da resposta se for erro
        error_message = None
        if status_code >= 400:
            try:
                # Tentar ler o corpo (funciona para JSON responses)
                body = await response.body()
                if body:
                    error_data = json.loads(body)
                    error_message = error_data.get("detail", str(error_data))
                else:
                    error_message = response.status_code
            except Exception:
                error_message = f"HTTP {status_code}"

        # Salvar log no banco (em thread separada para não bloquear)
        try:
            self._save_audit_log(
                method=method,
                endpoint=endpoint,
                status_code=status_code,
                response_time_ms=response_time_ms,
                ip_address=ip_address,
                user_agent=user_agent,
                user_id=user_id,
                error_message=error_message,
            )
        except Exception as e:
            logger.error(f"Erro ao salvar audit log: {e}")

        return response

    @staticmethod
    def _get_client_ip(request: Request) -> str:
        """
        Extrai o IP real do cliente, considerando proxies.
        
        Verifica: X-Forwarded-For, X-Real-IP, ou client.host
        """
        # X-Forwarded-For pode conter vários IPs, pega o primeiro
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        # X-Real-IP (usado por alguns proxies)
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        # IP direto do conexão
        if request.client:
            return request.client.host

        return "0.0.0.0"

    @staticmethod
    def _save_audit_log(
        method: str,
        endpoint: str,
        status_code: int,
        response_time_ms: float,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        user_id: Optional[int] = None,
        error_message: Optional[str] = None,
    ) -> None:
        """
        Salva log de auditoria no banco de dados.
        """
        db: Session = SessionLocal()
        try:
            LoggingService.log_request(
                db=db,
                method=method,
                endpoint=endpoint,
                status_code=status_code,
                response_time_ms=response_time_ms,
                ip_address=ip_address,
                user_agent=user_agent,
                user_id=user_id,
                error_message=error_message,
            )
        finally:
            db.close()
