from pydantic import BaseModel, AnyHttpUrl, field_validator
from datetime import datetime

ALIAS_RE = r"^[a-z0-9-_]{3,30}$"
RESERVED = {"api", "r", "admin", "login", "logout", "static", "healthz"}

class ShortenRequest(BaseModel):
    longUrl: AnyHttpUrl
    alias: str | None = None

    @field_validator("alias")
    @classmethod
    def validate_alias(cls, v):
        if v is None:
            return v
        alias = v.strip().lower()
        import re

        if not re.fullmatch(ALIAS_RE, alias):
            raise ValueError("alias must be 3–30 chars: a–z, 0–9, - or _")
        if alias in RESERVED:
            raise ValueError("alias is reserved")
        return alias


class ShortenResponse(BaseModel):
    shortId: str
    shortUrl: AnyHttpUrl


class UrlInfo(BaseModel):
    shortId: str
    longUrl: AnyHttpUrl
    createdAt: datetime
    expiresAt: datetime
    clicks: int
    lastAccessed: datetime | None = None
    shortUrl: AnyHttpUrl | None = None
