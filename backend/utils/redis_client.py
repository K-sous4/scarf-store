import os
import ssl

import redis


def make_redis_client() -> redis.Redis:
    """Cliente Redis com SSL relaxado para Upstash (rediss://) no Render."""
    url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    kwargs: dict = {"decode_responses": True}
    if url.startswith("rediss://"):
        kwargs["ssl_cert_reqs"] = ssl.CERT_NONE
    return redis.from_url(url, **kwargs)
