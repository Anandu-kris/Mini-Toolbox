from bson import ObjectId
from fastapi import Request, HTTPException, status

from app.auth.jwt_handler import verify_token

def _extract_user_id_from_request(request: Request) -> str:
    access = request.cookies.get("access_token")
    refresh = request.cookies.get("refresh_token")

    if access:
        payload = verify_token(access)
        if payload and payload.get("type") == "access":
            user_id = payload.get("sub")
            if user_id:
                return user_id

    if not refresh:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    refresh_payload = verify_token(refresh)
    if not refresh_payload or refresh_payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user_id = refresh_payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    return user_id


def get_current_user_id(request: Request) -> str:
    return _extract_user_id_from_request(request)


async def get_current_user(request: Request) -> dict:
    db = getattr(request.app.state, "db", None)
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="DB not ready",
        )

    user_id = _extract_user_id_from_request(request)

    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user id in token",
        )

    user = await db.users.find_one({"_id": oid})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


async def get_current_user_email(request: Request) -> str:
    user = await get_current_user(request)
    email = user.get("userEmail") or user.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account does not have an email address",
        )
    return email


def make_avatar_url(user: dict | None) -> str | None:
    if not user:
        return None

    data = user.get("avatarData")
    mime = user.get("avatarMime")
    if not data or not mime:
        return None

    return f"data:{mime};base64,{data}"