"""
Cache-Aside service backed by Redis.

Usage pattern:
  1. On read: check cache → hit: return; miss: query DB, store in cache, return.
  2. On write (create / update / delete): invalidate the relevant cache keys.
"""

import os
import json
import logging
from typing import Any, Optional

import redis

logger = logging.getLogger(__name__)

# TTLs (seconds)
TTL_FILTERS = 300  # 5 minutes for filter lists (categories, colors, materials)


class CacheService:
    """Redis-backed JSON cache with pattern-aware invalidation."""

    def __init__(self) -> None:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self._client = redis.from_url(redis_url, decode_responses=True)

    # ── read ──────────────────────────────────────────────────────────────────

    def get(self, key: str) -> Optional[Any]:
        """Return deserialized value or None on cache miss / error."""
        try:
            raw = self._client.get(key)
            if raw is None:
                return None
            logger.debug("[cache] HIT  %s", key)
            return json.loads(raw)
        except Exception as exc:
            logger.warning("[cache] get error (%s): %s", key, exc)
            return None

    # ── write ─────────────────────────────────────────────────────────────────

    def set(self, key: str, value: Any, ttl: int = TTL_FILTERS) -> None:
        """Serialize value to JSON and store with TTL. Silently skips on error."""
        try:
            self._client.setex(key, ttl, json.dumps(value, default=str))
            logger.debug("[cache] SET  %s  (ttl=%ds)", key, ttl)
        except Exception as exc:
            logger.warning("[cache] set error (%s): %s", key, exc)

    # ── invalidation ──────────────────────────────────────────────────────────

    def invalidate(self, *keys: str) -> None:
        """Delete one or more exact keys."""
        try:
            if keys:
                self._client.delete(*keys)
                logger.debug("[cache] DEL  %s", keys)
        except Exception as exc:
            logger.warning("[cache] invalidate error %s: %s", keys, exc)

    def invalidate_pattern(self, pattern: str) -> int:
        """Delete all keys matching a glob pattern. Returns count deleted."""
        count = 0
        try:
            for key in self._client.scan_iter(pattern):
                self._client.delete(key)
                count += 1
            if count:
                logger.debug("[cache] DEL pattern=%s  (%d keys)", pattern, count)
        except Exception as exc:
            logger.warning("[cache] invalidate_pattern error (%s): %s", pattern, exc)
        return count


# Singleton used by all route modules
cache = CacheService()
