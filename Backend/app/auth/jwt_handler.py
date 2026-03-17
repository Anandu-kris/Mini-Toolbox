# app/auth/jwt_handler.py
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError, ExpiredSignatureError
from app.config import settings


def _encode_token(data: dict, token_type: str, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    to_encode["type"] = token_type
    to_encode["exp"] = datetime.now(timezone.utc) + expires_delta

    return jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_access_token(data: dict) -> str:
    return _encode_token(
        data=data,
        token_type="access",
        expires_delta=timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(data: dict) -> str:
    return _encode_token(
        data=data,
        token_type="refresh",
        expires_delta=timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_TIME),
    )


def create_mfa_token(data: dict) -> str:
    return _encode_token(
        data=data,
        token_type="mfa_pending",
        expires_delta=timedelta(minutes=10),
    )


def verify_token(token: str | None) -> dict | None:
    if not token:
        return None

    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require_exp": True},
        )
    except (ExpiredSignatureError, JWTError):
        return None
