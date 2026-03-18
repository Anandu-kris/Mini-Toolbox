import base64
import io
import secrets
from typing import List

import pyotp
import qrcode
from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException

from app.config import settings
from app.core.logger import logger


TOTP_DIGITS = 6
TOTP_INTERVAL_SECONDS = 30
TOTP_VALID_WINDOW = 1
RECOVERY_CODE_COUNT = 8
RECOVERY_CODE_BYTES = 5  


def _get_fernet() -> Fernet:
    key = settings.TOTP_ENCRYPTION_KEY
    if not key:
        logger.error("[TOTP] Missing TOTP_ENCRYPTION_KEY")
        raise HTTPException(status_code=500, detail="TOTP encryption is not configured")

    try:
        return Fernet(key.encode())
    except Exception:
        logger.error("[TOTP] Invalid TOTP_ENCRYPTION_KEY format")
        raise HTTPException(status_code=500, detail="Invalid TOTP encryption key")


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def build_totp_uri(secret: str, account_name: str, issuer_name: str | None = None) -> str:
    issuer = issuer_name or settings.TOTP_ISSUER_NAME or "Mini Toolbox"
    totp = pyotp.TOTP(secret, digits=TOTP_DIGITS, interval=TOTP_INTERVAL_SECONDS)
    return totp.provisioning_uri(name=account_name, issuer_name=issuer)


def generate_qr_code_data_url(content: str) -> str:
    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=2,
    )
    qr.add_data(content)
    qr.make(fit=True)

    image = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


def verify_totp_code(secret: str, code: str) -> bool:
    if not code or not code.isdigit():
        return False

    totp = pyotp.TOTP(secret, digits=TOTP_DIGITS, interval=TOTP_INTERVAL_SECONDS)
    return bool(
        totp.verify(
            code,
            valid_window=TOTP_VALID_WINDOW,
        )
    )


def encrypt_totp_secret(secret: str) -> str:
    fernet = _get_fernet()
    return fernet.encrypt(secret.encode()).decode()


def decrypt_totp_secret(encrypted_secret: str) -> str:
    fernet = _get_fernet()
    try:
        return fernet.decrypt(encrypted_secret.encode()).decode()
    except (InvalidToken, ValueError):
        logger.error("[TOTP] Failed to decrypt TOTP secret")
        raise HTTPException(status_code=500, detail="Failed to read TOTP secret")


def generate_recovery_codes(count: int = RECOVERY_CODE_COUNT) -> List[str]:
    codes: list[str] = []
    for _ in range(count):
        raw = secrets.token_hex(RECOVERY_CODE_BYTES).upper()
        code = f"{raw[:5]}-{raw[5:10]}"
        codes.append(code)
    return codes