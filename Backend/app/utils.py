import secrets
import string

ALPHABET = string.ascii_letters + string.digits  # 62 chars

def generate_short_id(length: int = 7) -> str:
    return "".join(secrets.choice(ALPHABET) for _ in range(length))
