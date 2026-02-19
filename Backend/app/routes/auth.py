# app/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from datetime import datetime, timezone

from app.auth.hash import hash_password, verify_password
from app.auth.jwt_handler import create_access_token, verify_token, create_refresh_token
from app.schemas.user_schemas import UserSignup, UserLogin, UserOut
from app.config import settings
from app.core.logger import logger 

router = APIRouter(prefix="/auth", tags=["Auth"])


def get_db(request: Request):
    db = getattr(request.app.state, "db", None)
    if db is None:
        logger.error("[AUTH] DB not ready: request.app.state.db missing")
        raise HTTPException(status_code=503, detail="DB not ready")
    return db


# Signup
@router.post("/signup")
async def signup(user: UserSignup, db=Depends(get_db)):
    logger.info(f"[AUTH] signup attempt email={user.email}")

    existing = await db.users.find_one({"email": user.email})
    if existing:
        logger.warning(f"[AUTH] signup failed (already exists) email={user.email}")
        raise HTTPException(status_code=400, detail="User already exists")

    hashed = hash_password(user.password)

    doc = {
        "email": user.email,
        "password": hashed,
        "createdAt": datetime.now(timezone.utc),
    }

    await db.users.insert_one(doc)

    logger.info(f"[AUTH] signup success email={user.email}")
    return {"msg": "User registered successfully"}


# Login
@router.post("/login")
async def login(user: UserLogin, response: Response, db=Depends(get_db)):
    logger.info(f"[AUTH] login attempt email={user.email}")

    existing = await db.users.find_one({"email": user.email})
    if not existing:
        logger.warning(f"[AUTH] login failed (email not found) email={user.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(user.password, existing["password"]):
        logger.warning(f"[AUTH] login failed (wrong password) email={user.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Issue tokens
    access_token = create_access_token({"sub": existing["email"]})
    refresh_token = create_refresh_token({"sub": existing["email"]})

    logger.info(f"[AUTH] login success email={existing['email']} issuing tokens")

    # Cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_TIME * 60 * 60,
        path="/",
    )

    logger.info(f"[AUTH] cookies set email={existing['email']}")
    return {"msg": "Login successful", "email": existing["email"]}


# Verify current user
@router.get("/me", response_model=UserOut)
async def get_me(request: Request, response: Response):
    access = request.cookies.get("access_token")
    refresh = request.cookies.get("refresh_token")

    logger.info(
        f"[AUTH] /me called has_access={'yes' if access else 'no'} has_refresh={'yes' if refresh else 'no'}"
    )

    # Validate access token
    payload = verify_token(access)
    if payload and payload.get("type") == "access":
        logger.info(f"[AUTH] /me success (access token valid) email={payload['sub']}")
        return {"email": payload["sub"]}

    logger.warning("[AUTH] /me access token invalid/expired, trying refresh token")

    # Access expired → use refresh token
    if not refresh:
        logger.warning("[AUTH] /me failed (no refresh token)")
        raise HTTPException(status_code=403, detail="Not authenticated")

    refresh_payload = verify_token(refresh)
    if not refresh_payload or refresh_payload.get("type") != "refresh":
        logger.warning("[AUTH] /me failed (invalid refresh token)")
        raise HTTPException(status_code=403, detail="Invalid refresh token")

    # Issue new access token
    new_access = create_access_token({"sub": refresh_payload["sub"]})

    response.set_cookie(
        key="access_token",
        value=new_access,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=15 * 60,
        path="/",
    )

    logger.info(f"[AUTH] /me refreshed access token email={refresh_payload['sub']}")
    return {"email": refresh_payload["sub"]}


# Logout
@router.post("/logout")
async def logout(request: Request, response: Response, db=Depends(get_db)):
    refresh = request.cookies.get("refresh_token")

    logger.info(f"[AUTH] logout called has_refresh={'yes' if refresh else 'no'}")

    email = None
    payload = verify_token(refresh)
    if payload:
        email = payload.get("sub")

    if email:
        await db.users.update_one({"email": email}, {"$unset": {"refreshToken": ""}})
        logger.info(f"[AUTH] logout success email={email}")
    else:
        logger.warning("[AUTH] logout: could not extract email from refresh token")

    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")

    logger.info("[AUTH] cookies cleared")
    return {"message": "Logged out"}
