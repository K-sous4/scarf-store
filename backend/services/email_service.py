import logging
import smtplib
from email.message import EmailMessage

from config.settings import (
    DEBUG,
    FRONTEND_URL,
    SMTP_FROM,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_USE_TLS,
    SMTP_USER,
)

logger = logging.getLogger(__name__)


def build_password_reset_url(token: str) -> str:
    base = FRONTEND_URL.rstrip("/")
    return f"{base}/reset-password?token={token}"


def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    subject = "Scarf Store — redefinir senha"
    body = (
        "Voce solicitou a redefinicao de senha na Scarf Store.\n\n"
        f"Acesse o link abaixo (valido por 1 hora):\n{reset_url}\n\n"
        "Se voce nao fez esta solicitacao, ignore este e-mail.\n"
    )

    if not SMTP_HOST or not SMTP_FROM:
        logger.info(
            "SMTP nao configurado. Link de recuperacao para %s: %s",
            to_email,
            reset_url,
        )
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = SMTP_FROM
    message["To"] = to_email
    message.set_content(body)

    try:
        if SMTP_USE_TLS:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                server.starttls()
                if SMTP_USER and SMTP_PASSWORD:
                    server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(message)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                if SMTP_USER and SMTP_PASSWORD:
                    server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(message)
        logger.info("E-mail de recuperacao enviado para %s", to_email)
        return True
    except Exception as exc:
        logger.error("Falha ao enviar e-mail para %s: %s", to_email, exc)
        if DEBUG:
            logger.info("Link de recuperacao (fallback): %s", reset_url)
        return False
