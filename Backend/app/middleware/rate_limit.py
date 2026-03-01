import time
from typing import Tuple
from fastapi import HTTPException, Request
from app.core.redis import get_redis

LUA_TOKEN_BUCKET = """
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_per_sec = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])

local data = redis.call("HMGET", key, "tokens", "ts")
local tokens = tonumber(data[1])
local ts = tonumber(data[2])

if tokens == nil then tokens = capacity end
if ts == nil then ts = now end

local delta = now - ts
if delta < 0 then delta = 0 end

tokens = math.min(capacity, tokens + (delta * refill_per_sec))
ts = now

local allowed = 0
local retry_after = 0

if tokens >= cost then
  allowed = 1
  tokens = tokens - cost
else
  local missing = cost - tokens
  if refill_per_sec > 0 then
    retry_after = missing / refill_per_sec
  else
    retry_after = 1
  end
end

redis.call("HMSET", key, "tokens", tokens, "ts", ts)

local ttl = math.ceil((capacity / refill_per_sec) * 2)
if ttl < 60 then ttl = 60 end
redis.call("EXPIRE", key, ttl)

return { allowed, tokens, retry_after }
"""

def get_client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

async def token_bucket_check(
    *, key: str, capacity: int, refill_per_sec: float, cost: int = 1
) -> Tuple[bool, float, float]:
    r = get_redis()
    now = time.time()
    allowed, tokens_left, retry_after = await r.eval(
        LUA_TOKEN_BUCKET, 1, key, capacity, refill_per_sec, now, cost
    )
    return bool(int(allowed)), float(tokens_left), float(retry_after)

async def enforce_token_bucket(
    *, key: str, capacity: int, refill_per_sec: float, cost: int = 1
) -> Tuple[bool, int]:
    allowed, _tokens_left, retry_after = await token_bucket_check(
        key=key, capacity=capacity, refill_per_sec=refill_per_sec, cost=cost
    )
    retry_after_int = max(1, int(retry_after + 0.999))
    return allowed, retry_after_int

def too_many(retry_after_seconds: int, limit: int):
    raise HTTPException(
        status_code=429,
        detail=f"Too many login attempts. Try again in {retry_after_seconds}s.",
        headers={
            "Retry-After": str(retry_after_seconds),
            "X-RateLimit-Limit": str(limit),
            "X-RateLimit-Remaining": "0",
        },
    )