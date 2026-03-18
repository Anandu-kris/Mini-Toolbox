from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import Depends, HTTPException, status

from app.core.logger import logger
from app.deps.auth_deps import get_current_user
from app.core.redis import get_redis


# Helpers
def _normalize_user_id(user_id: str | ObjectId) -> str:
    if isinstance(user_id, ObjectId):
        return str(user_id)
    return str(user_id)


# Rate limiting (Redis)
def _rl_key(user_id: str, action: str) -> str:
    return f"rl:ai:{action}:{user_id}"


async def ai_rate_limit(
    action: str,
    *,
    limit: int,
    window_seconds: int,
    user_id: str,
    redis,
):
    """
    Fixed window counter:
    - INCR key
    - if first hit => EXPIRE window
    """
    key = _rl_key(user_id, action)

    try:
        count = await redis.incr(key)
        if count == 1:
            await redis.expire(key, window_seconds)
    except Exception as e:
        logger.exception(f"[AI][RL] Redis error action={action} userId={user_id}: {e}")
        return

    if count > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded for {action}. Try again soon.",
        )


def rl_dep(action: str, limit: int = 30, window_seconds: int = 60):
    """
    Use as:
      Depends(rl_dep("copilot", 20, 60))
    """

    async def _dep(
        current_user: dict = Depends(get_current_user),
        redis=Depends(get_redis),
    ):
        user_id = _normalize_user_id(current_user["_id"])

        await ai_rate_limit(
            action,
            limit=limit,
            window_seconds=window_seconds,
            user_id=user_id,
            redis=redis,
        )
        return True

    return _dep


# Logging / Metrics (Mongo)
async def log_ai_event(
    db,
    *,
    user_id: str | ObjectId,
    action: str,
    ok: bool,
    latency_ms: float,
    note_id: Optional[str] = None,
    meta: Optional[dict] = None,
    error: Optional[str] = None,
):
    """
    Writes to Mongo: db.ai_logs
    Keep it simple. No tokens needed; store char lengths etc in meta.
    """
    try:
        owner_id = ObjectId(user_id) if isinstance(user_id, str) else user_id

        doc = {
            "userId": owner_id,
            "action": action,
            "noteId": note_id,
            "ok": ok,
            "latencyMs": round(latency_ms, 2),
            "meta": meta or {},
            "error": error,
            "createdAt": datetime.now(timezone.utc),
        }

        await db.ai_logs.insert_one(doc)

    except Exception as e:
        logger.exception(f"[AI][LOG] failed insert action={action} userId={user_id}: {e}")


class Timer:
    def __init__(self):
        self.start = time.perf_counter()

    def ms(self) -> float:
        return (time.perf_counter() - self.start) * 1000.0