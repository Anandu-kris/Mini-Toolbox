from fastapi import Depends, Request
from app.middleware.rate_limit import (
    enforce_token_bucket,
    get_client_ip,
    too_many,
)

def login_rate_limit(
    *,
    ip_capacity: int = 10,
    ip_window_seconds: int = 60,
    email_capacity: int = 5,
    email_window_seconds: int = 60,
):
    """
    Defaults:
      - per IP:    10/min (burst 10)
      - per email:  5/min (burst 5)
    """

    ip_refill = ip_capacity / ip_window_seconds
    email_refill = email_capacity / email_window_seconds

    async def _dep(request: Request):
        ip = get_client_ip(request)

        body = await request.json()
        email = (body.get("email") or "").strip().lower()

        # IP limiter
        ip_key = f"rl:login:ip:{ip}"
        allowed_ip, retry_ip = await enforce_token_bucket(
            key=ip_key,
            capacity=ip_capacity,
            refill_per_sec=ip_refill,
            cost=1,
        )
        if not allowed_ip:
            too_many(retry_ip, ip_capacity)

        # Email limiter
        if email:
            email_key = f"rl:login:email:{email}"
            allowed_email, retry_email = await enforce_token_bucket(
                key=email_key,
                capacity=email_capacity,
                refill_per_sec=email_refill,
                cost=1,
            )
            if not allowed_email:
                too_many(retry_email, email_capacity)

    return Depends(_dep)