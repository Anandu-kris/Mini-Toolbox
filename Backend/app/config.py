import os
from dotenv import load_dotenv, find_dotenv
from pydantic_settings import BaseSettings
from pydantic import model_validator

load_dotenv(find_dotenv())


class Settings(BaseSettings):
    MONGODB_URI: str | None = os.getenv("MONGODB_URI")
    DB_NAME: str = os.getenv("DB_NAME", "url_shortener")
    LOG_FILE: str = "app/logs/app.log"
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    BASE_URL: str = os.getenv("BASE_URL", "http://localhost:8000")
    ALLOWED_ORIGINS: list[str] = [
        o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()
    ]
    JWT_SECRET: str | None = os.getenv("JWT_SECRET")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "15")
    )
    JWT_REFRESH_TOKEN_EXPIRE_TIME: int = int(
        os.getenv("JWT_REFRESH_TOKEN_EXPIRE_TIME", "6")
    )
    URL_EXPIRY_DAYS: int = int(os.getenv("URL_EXPIRY_DAYS", "150"))
    GOOGLE_CLIENT_ID: str | None = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str | None = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: str | None = os.getenv("GOOGLE_REDIRECT_URI")
    SESSION_SECRET_KEY: str | None = os.getenv("SESSION_SECRET_KEY")
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")
    OPENAI_EMBED_MODEL: str | None = os.getenv("OPENAI_EMBED_MODEL")
    OPENAI_CHAT_MODEL: str | None = os.getenv("OPENAI_CHAT_MODEL")
    OPENAI_CHAT_URL: str | None = os.getenv("OPENAI_CHAT_URL")
    OPENAI_EMBED_URL: str | None = os.getenv("OPENAI_EMBED_URL")
    EMBED_DIM: int = 1536
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    REDIS_URL: str | None = os.getenv("REDIS_URL")
    TWILIO_ACCOUNT_SID: str | None = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN: str | None = os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_VERIFY_SERVICE_SID: str | None = os.getenv("TWILIO_VERIFY_SERVICE_SID")
    TOTP_ENCRYPTION_KEY: str | None = os.getenv("TOTP_ENCRYPTION_KEY")
    TOTP_ISSUER_NAME: str | None = os.getenv("TOTP_ISSUER_NAME")
    WORDLE_WORD_LENGTH: int = 5
    WORDLE_MAX_ATTEMPTS: int = 6
    MAX_QUERY_CHARS: int = 500
    MAX_NOTE_CHARS: int = 12000
    COPILOT_TOP_K: int = 6
    COPILOT_TOP_K_MAX: int = 10
    WORDLE_TIMEZONE: str = "Asia/Kolkata"

    @model_validator(mode="after")
    def validate_env(self):
        if not self.MONGODB_URI:
            raise RuntimeError("MONGODB_URI is missing in .env")
        if not self.JWT_SECRET:
            raise RuntimeError("JWT_SECRET is missing in .env")
        return self


settings = Settings()
