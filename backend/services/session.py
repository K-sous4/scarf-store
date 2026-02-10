import os
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
import redis


class SessionManager:
    """Manager for session handling with Redis backend."""

    def __init__(self):
        """Initialize Redis connection."""
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
        self.session_ttl = 24 * 60 * 60  # 24 hours in seconds

    def create_session(self, user_id: int, username: str, role: str) -> str:
        """
        Create a new session for a user.
        
        Args:
            user_id: User ID
            username: Username
            role: User role (user, admin)
            
        Returns:
            Session ID (session cookie value)
        """
        session_id = str(uuid.uuid4())
        session_data = {
            "user_id": user_id,
            "username": username,
            "role": role,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        # Store in Redis with TTL
        self.redis_client.setex(
            f"session:{session_id}",
            self.session_ttl,
            json.dumps(session_data),
        )
        
        return session_id

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve session data from Redis.
        
        Args:
            session_id: Session ID to retrieve
            
        Returns:
            Session data dict or None if not found/expired
        """
        session_data = self.redis_client.get(f"session:{session_id}")
        
        if session_data is None:
            return None
        
        try:
            return json.loads(session_data)
        except json.JSONDecodeError:
            return None

    def invalidate_session(self, session_id: str) -> bool:
        """
        Invalidate/delete a session.
        
        Args:
            session_id: Session ID to invalidate
            
        Returns:
            True if session was deleted, False if not found
        """
        result = self.redis_client.delete(f"session:{session_id}")
        return result > 0

    def refresh_session(self, session_id: str) -> bool:
        """
        Refresh session TTL (extend expiration time).
        Does NOT create a new session ID, just extends the TTL.
        
        Args:
            session_id: Session ID to refresh
            
        Returns:
            True if session was refreshed, False if not found
        """
        result = self.redis_client.expire(f"session:{session_id}", self.session_ttl)
        return result > 0

    def rotate_session(self, old_session_id: str, user_id: int, username: str, role: str) -> Optional[str]:
        """
        Rotate (renew) a session by creating a new session ID while keeping user data.
        Used when you need a completely new session ID (e.g., after privilege escalation).
        
        Args:
            old_session_id: Old session ID to replace
            user_id: User ID
            username: Username
            role: User role
            
        Returns:
            New session ID or None if old session doesn't exist
        """
        # Verify old session exists
        old_session = self.get_session(old_session_id)
        if old_session is None:
            return None
        
        # Delete old session
        self.invalidate_session(old_session_id)
        
        # Create new session with same data
        new_session_id = self.create_session(user_id, username, role)
        
        return new_session_id


# Global session manager instance
session_manager = SessionManager()
