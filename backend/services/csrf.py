import os
import secrets
import json
from datetime import datetime, timedelta
import redis

# Get Redis URL from environment
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

CSRF_TOKEN_LENGTH = 32
CSRF_TOKEN_TTL = 3600  # 1 hour


class CSRFProtection:
    """CSRF token generation and validation."""

    @staticmethod
    def generate_token(session_id: str) -> str:
        """
        Generate a CSRF token for a session.
        
        Args:
            session_id: Session ID to bind the token to
            
        Returns:
            CSRF token
        """
        token = secrets.token_urlsafe(CSRF_TOKEN_LENGTH)
        
        # Store token in Redis with TTL
        redis_client.setex(
            f"csrf_token:{token}",
            CSRF_TOKEN_TTL,
            session_id
        )
        
        return token

    @staticmethod
    def validate_token(token: str, session_id: str, consume: bool = False) -> bool:
        """
        Validate a CSRF token.
        
        Args:
            token: CSRF token to validate
            session_id: Session ID to verify against (currently unused, token validity is session-agnostic)
            consume: If True, delete the token after validation (default: False for reusability)
            
        Returns:
            True if token exists and is valid, False otherwise
        """
        key = f"csrf_token:{token}"
        stored_session = redis_client.get(key)
        
        print(f"[CSRF Service] Looking for key: {key}")
        print(f"[CSRF Service] Token found: {stored_session is not None}")
        
        if stored_session is None:
            print(f"[CSRF Service] Token NOT found in Redis - INVALID")
            return False
        
        print(f"[CSRF Service] Token is valid and exists in Redis")
        
        # Optionally consume token (delete after use)
        if consume:
            redis_client.delete(key)
            print(f"[CSRF Service] Token consumed (deleted from Redis)")
        
        return True

    @staticmethod
    def invalidate_all_tokens(session_id: str) -> int:
        """
        Invalidate all CSRF tokens for a session (e.g., on logout).
        
        Args:
            session_id: Session ID whose tokens to invalidate
            
        Returns:
            Number of tokens invalidated
        """
        # Find and delete all tokens for this session
        pattern = "csrf_token:*"
        tokens = redis_client.keys(pattern)
        
        deleted_count = 0
        for token_key in tokens:
            if redis_client.get(token_key) == session_id:
                redis_client.delete(token_key)
                deleted_count += 1
        
        return deleted_count


csrf_protection = CSRFProtection()
