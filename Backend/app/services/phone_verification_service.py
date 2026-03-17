import re
from fastapi import HTTPException


E164_REGEX = r"^\+[1-9]\d{7,14}$"


def normalize_mobile_number(mobile: str) -> str:
    """
    Normalize and validate mobile number to E.164-like format.
    Example accepted format: +9198765XXXXX
    """
    if mobile is None:
        raise HTTPException(status_code=400, detail="Mobile number is required")

    value = mobile.strip().replace(" ", "").replace("-", "")

    if not value.startswith("+"):
        raise HTTPException(
            status_code=400,
            detail="Mobile number must be in international format like +9198765XXXXX",
        )

    if not re.fullmatch(E164_REGEX, value):
        raise HTTPException(status_code=400, detail="Invalid mobile number format")

    return value


def mask_mobile_number(mobile: str) -> str:
    """
    Example: +919876543210 -> +91******3210
    """
    value = normalize_mobile_number(mobile)

    if len(value) <= 6:
        return value

    prefix = value[:3]
    suffix = value[-4:]
    middle_len = len(value) - len(prefix) - len(suffix)

    if middle_len <= 0:
        return value

    return f"{prefix}{'*' * middle_len}{suffix}"