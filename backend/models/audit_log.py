from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Boolean
from datetime import datetime
from database.db import Base


class AuditLog(Base):
    """
    Modelo para armazenar logs de auditoria de todas as requisições HTTP
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    # Informações da requisição
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    method = Column(String(10), nullable=False)  # GET, POST, PUT, DELETE, etc
    endpoint = Column(String(255), nullable=False, index=True)  # /api/v1/auth/login
    
    # Informações da resposta
    status_code = Column(Integer, nullable=False, index=True)
    response_time_ms = Column(Float, default=0)  # Tempo em milissegundos
    
    # Informações do usuário
    user_id = Column(Integer, nullable=True, index=True)  # Nullable para requisições não autenticadas
    username = Column(String(255), nullable=True, index=True)  # Para rastrear tentativas de login
    
    # Informações da requisição HTTP
    ip_address = Column(String(45), nullable=True)  # IPv4 ou IPv6
    user_agent = Column(String(500), nullable=True)
    
    # Detalhes do erro
    error_message = Column(Text, nullable=True)  # Mensagem de erro se houver
    
    # Indicadores
    is_error = Column(Boolean, default=False, index=True)
    is_auth_attempt = Column(Boolean, default=False, index=True)  # Marcado como True em tentativas de login
    is_unauthorized = Column(Boolean, default=False, index=True)  # Marcado como True em 401/403

    def __repr__(self):
        return f"<AuditLog(timestamp={self.timestamp}, method={self.method}, endpoint={self.endpoint}, status_code={self.status_code})>"
