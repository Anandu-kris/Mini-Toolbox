from fastapi import Request, HTTPException, status
from app.auth.jwt_handler import verify_token

def get_current_user_email(request: Request) -> str:
    access = request.cookies.get("access_token")
    refresh = request.cookies.get("refresh_token")

    if access:
        payload = verify_token(access)
        if payload and payload.get("type") == "access":
            email = payload.get("sub")
            if email:
                return email

    if not refresh:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not Authenticated",
        )

    refresh_payload = verify_token(refresh)
    if not refresh_payload or refresh_payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Token",
        )

    email = refresh_payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Token",
        )

    return email

# Avatar deps
def make_avatar_url(user: dict | None) -> str | None:
  if not user:
    return None
  data = user.get("avatarData")
  mime = user.get("avatarMime")
  if not data or not mime:
    return None
  return f"data:{mime};base64,{data}"
