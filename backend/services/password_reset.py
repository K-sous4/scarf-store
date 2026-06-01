import json
import logging
import secrets
from datetime import datetime
from typing import Optional

from config.settings import PASSWORD_RESET_TTL_SECONDS
from services.session import session_manager

logger = logging.getLogger(__name__)

RESET_KEY_PREFIX = "password_reset:"
RATE_EMAIL_PREFIX = "pwd_reset_rate:email:"
RATE_IP_PREFIX = "pwd_reset_rate:ip:"


class PasswordResetService:
    def __init__(
        self,
        token_ttl_seconds: int = 3600,
        max_per_email: int = 3,
        max_per_ip: int = 10,
        rate_window_seconds: int = 3600,
    ):
        self.redis = session_manager.redis_client
        self.token_ttl = token_ttl_seconds
        self.max_per_email = max_per_email
        self.max_per_ip = max_per_ip
        self.rate_window = rate_window_seconds

    def _rate_limited(self, key: str, limit: int) -> bool:
        count = self.redis.incr(key)
        if count == 1:
            self.redis.expire(key, self.rate_window)
        return count > limit

    def is_rate_limited(self, email: str, ip_address: str | None) -> bool:
        normalized = email.strip().lower()
        if self._rate_limited(f"{RATE_EMAIL_PREFIX}{normalized}", self.max_per_email):
            return True
        if ip_address and self._rate_limited(f"{RATE_IP_PREFIX}{ip_address}", self.max_per_ip):
            return True
        return False

    def create_token(self, user_id: int) -> str:
        token = secrets.token_urlsafe(32)
        payload = {
            "user_id": user_id,
            "created_at": datetime.utcnow().isoformat(),
        }
        self.redis.setex(
            f"{RESET_KEY_PREFIX}{token}",
            self.token_ttl,
            json.dumps(payload),
        )
        return token

    def peek_user_id(self, token: str) -> Optional[int]:
        raw = self.redis.get(f"{RESET_KEY_PREFIX}{token}")
        if not raw:
            return None
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return None
        user_id = data.get("user_id")
        return int(user_id) if user_id is not None else None

    def consume_token(self, token: str) -> Optional[int]:
        key = f"{RESET_KEY_PREFIX}{token}"
        raw = self.redis.get(key)
        if not raw:
            return None
        self.redis.delete(key)
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return None
        user_id = data.get("user_id")
        return int(user_id) if user_id is not None else None


password_reset_service = PasswordResetService(token_ttl_seconds=PASSWORD_RESET_TTL_SECONDS)
