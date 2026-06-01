import logging
import time
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from models.audit_log import AuditLog

logger = logging.getLogger(__name__)


class LoggingService:
    """
    Serviço para registrar logs de auditoria no banco de dados.
    Centraliza toda a lógica de logging da aplicação.
    """

    @staticmethod
    def log_request(
        db: Session,
        method: str,
        endpoint: str,
        status_code: int,
        response_time_ms: float,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        user_id: Optional[int] = None,
        username: Optional[str] = None,
        error_message: Optional[str] = None,
        is_auth_attempt: bool = False,
    ) -> AuditLog:
        """
        Registra uma requisição no banco de dados.

        Args:
            db: Sessão do banco de dados
            method: Método HTTP (GET, POST, etc)
            endpoint: Caminho da rota (/api/v1/auth/login)
            status_code: Código de status HTTP de resposta
            response_time_ms: Tempo de resposta em milissegundos
            ip_address: Endereço IP do cliente
            user_agent: User-Agent do cliente
            user_id: ID do usuário autenticado (se houver)
            username: Username tentado (para login)
            error_message: Mensagem de erro (se houver)
            is_auth_attempt: Se é uma tentativa de autenticação

        Returns:
            AuditLog: O log criado
        """
        try:
            # Determinar se é erro
            is_error = status_code >= 400
            is_unauthorized = status_code in [401, 403]

            # Criar log
            audit_log = AuditLog(
                method=method,
                endpoint=endpoint,
                status_code=status_code,
                response_time_ms=response_time_ms,
                ip_address=ip_address,
                user_agent=user_agent,
                user_id=user_id,
                username=username,
                error_message=error_message,
                is_error=is_error,
                is_auth_attempt=is_auth_attempt,
                is_unauthorized=is_unauthorized,
                timestamp=datetime.utcnow(),
            )

            # Salvar no banco
            db.add(audit_log)
            db.commit()
            db.refresh(audit_log)

            # Log em console (estruturado)
            log_level = logging.WARNING if is_error else logging.INFO
            log_message = (
                f"[{method}] {endpoint} - Status: {status_code} - "
                f"Time: {response_time_ms:.2f}ms - IP: {ip_address}"
            )

            if user_id:
                log_message += f" - User: {user_id}"
            if username:
                log_message += f" - Username: {username}"
            if error_message:
                log_message += f" - Error: {error_message}"

            logger.log(log_level, log_message)

            return audit_log

        except Exception as e:
            logger.error(f"Erro ao salvar log de auditoria: {e}")
            # Não levantar exceção para não quebrar a requisição
            return None

    @staticmethod
    def log_auth_failure(
        db: Session,
        username: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        error_message: str = "Invalid credentials",
    ) -> AuditLog:
        """
        Registra uma falha de autenticação de forma estruturada.

        Args:
            db: Sessão do banco de dados
            username: Username informado na tentativa de login
            ip_address: IP do cliente
            user_agent: User-Agent do cliente
            error_message: Motivo da falha

        Returns:
            AuditLog: O log criado
        """
        return LoggingService.log_request(
            db=db,
            method="POST",
            endpoint="/api/v1/auth/login",
            status_code=401,
            response_time_ms=0,
            ip_address=ip_address,
            user_agent=user_agent,
            username=username,
            error_message=error_message,
            is_auth_attempt=True,
        )

    @staticmethod
    def log_auth_success(
        db: Session,
        user_id: int,
        username: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        response_time_ms: float = 0,
    ) -> AuditLog:
        """
        Registra um login bem-sucedido.

        Args:
            db: Sessão do banco de dados
            user_id: ID do usuário autenticado
            username: Username do usuário
            ip_address: IP do cliente
            user_agent: User-Agent do cliente
            response_time_ms: Tempo de resposta

        Returns:
            AuditLog: O log criado
        """
        return LoggingService.log_request(
            db=db,
            method="POST",
            endpoint="/api/v1/auth/login",
            status_code=200,
            response_time_ms=response_time_ms,
            ip_address=ip_address,
            user_agent=user_agent,
            user_id=user_id,
            username=username,
            error_message=None,
            is_auth_attempt=True,
        )

    @staticmethod
    def get_recent_logs(
        db: Session,
        limit: int = 50,
        endpoint: Optional[str] = None,
        user_id: Optional[int] = None,
    ) -> list[AuditLog]:
        """
        Retorna logs recentes com filtros opcionais.

        Args:
            db: Sessão do banco de dados
            limit: Quantidade máxima de logs
            endpoint: Filtrar por endpoint (opcional)
            user_id: Filtrar por user_id (opcional)

        Returns:
            list[AuditLog]: Lista de logs
        """
        query = db.query(AuditLog)

        if endpoint:
            query = query.filter(AuditLog.endpoint == endpoint)

        if user_id:
            query = query.filter(AuditLog.user_id == user_id)

        return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()

    @staticmethod
    def get_auth_failed_attempts(
        db: Session,
        username: str,
        minutes: int = 60,
        limit: int = 100,
    ) -> list[AuditLog]:
        """
        Retorna tentativas falhadas de login para um username.
        Útil para detectar brute force.

        Args:
            db: Sessão do banco de dados
            username: Username para filtrar
            minutes: Últimos X minutos
            limit: Limite de resultados

        Returns:
            list[AuditLog]: Lista de tentativas falhadas
        """
        from datetime import timedelta

        cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)

        return (
            db.query(AuditLog)
            .filter(
                AuditLog.is_auth_attempt == True,
                AuditLog.username == username,
                AuditLog.status_code == 401,
                AuditLog.timestamp >= cutoff_time,
            )
            .order_by(AuditLog.timestamp.desc())
            .limit(limit)
            .all()
        )
