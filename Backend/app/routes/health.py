from fastapi import APIRouter, Request
from app.core.redis import get_redis

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("/db")
async def db_health(request: Request):
    db = getattr(request.app.state, "db", None)
    return {"db_ready": db is not None}

@router.get("/redis")
async def redis_health():
    r = get_redis()
    pong = await r.ping()
    return {"redis": "ok" if pong else "down"}