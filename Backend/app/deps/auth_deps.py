from fastapi import Request, HTTPException, status
from app.auth.jwt_handler import verify_token

def get_current_user_email(request: Request) -> str:
  access = request.cookies.get("access_token")
  if not access:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not Authenticated")
  
  payload = verify_token(access)
  email = payload.get("sub")
  token_type = payload.get("type")
  
  if not email or token_type != "access":
    raise HTTPException (status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Token")
  
  return email

