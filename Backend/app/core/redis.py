import os
from redis.asyncio import Redis
from app.config import settings


redis_client: Redis | None = None

async def init_redis():
    global redis_client
    redis_client = Redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
    try:
        await redis_client.ping()
    except Exception as e:
        print(">> Redis not reachable:", e)
        
async def close_redis():
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None

def get_redis() -> Redis:
    if redis_client is None:
        raise RuntimeError("Redis not initialized")
    return redis_client