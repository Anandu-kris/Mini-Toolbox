# app/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, Request, Response, UploadFile, File
import base64
from datetime import datetime, timezone

from app.deps.rate_limiter_deps import login_rate_limit
from app.auth.hash import hash_password, verify_password
from app.auth.jwt_handler import create_access_token, verify_token, create_refresh_token
from app.schemas.user_schemas import UserSignup, UserLogin, UserOut, UserUpdate, UserPasswordUpdate
from app.config import settings
from app.core.logger import logger 
from app.deps.auth_deps import make_avatar_url, get_current_user_email

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
        "name": user.name,
        "email": user.email,
        "password": hashed,
        "createdAt": datetime.now(timezone.utc),
        "avatarData": None,      
        "avatarMime": None,
    }

    await db.users.insert_one(doc)

    logger.info(f"[AUTH] signup success email={user.email}")
    return {"msg": "User registered successfully"}


# Login
@router.post("/login", dependencies=[login_rate_limit(ip_capacity=10, ip_window_seconds=60, email_capacity=5, email_window_seconds=60)])
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
    
    db = request.app.state.db

    access = request.cookies.get("access_token")
    refresh = request.cookies.get("refresh_token")

    logger.info(
        f"[AUTH] /me called has_access={'yes' if access else 'no'} has_refresh={'yes' if refresh else 'no'}"
    )

    # Try access token
    payload = verify_token(access)
    if payload and payload.get("type") == "access":
        email = payload["sub"]
        user = await db.users.find_one({"email": email})

        logger.info(f"[AUTH] /me success (access token valid) email={email}")

        return {
            "email": email,
            "name": user.get("name") if user else None,
            "avatarUrl": make_avatar_url(user),
        }

    logger.warning("[AUTH] /me access token invalid/expired, trying refresh token")

    # Try refresh token
    if not refresh:
        logger.warning("[AUTH] /me failed (no refresh token)")
        raise HTTPException(status_code=403, detail="Not authenticated")

    refresh_payload = verify_token(refresh)
    if not refresh_payload or refresh_payload.get("type") != "refresh":
        logger.warning("[AUTH] /me failed (invalid refresh token)")
        raise HTTPException(status_code=403, detail="Invalid refresh token")

    email = refresh_payload["sub"]

    # Issue new access token
    new_access = create_access_token({"sub": email})

    response.set_cookie(
        key="access_token",
        value=new_access,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=15 * 60,
        path="/",
    )

    user = await db.users.find_one({"email": email})

    logger.info(f"[AUTH] /me refreshed access token email={email}")

    return {
        "email": email,
        "name": user.get("name") if user else None,
        "avatarUrl": make_avatar_url(user),
    }


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


# Avatar upload
@router.post("/avatar")
async def upload_avatar(
    request: Request,
    response: Response,
    avatar: UploadFile = File(...),
):
    db = request.app.state.db

    access = request.cookies.get("access_token")
    refresh = request.cookies.get("refresh_token")

    payload = verify_token(access)
    email = None

    if payload and payload.get("type") == "access":
        email = payload["sub"]
    else:
        if not refresh:
            raise HTTPException(status_code=403, detail="Not authenticated")
        refresh_payload = verify_token(refresh)
        if not refresh_payload or refresh_payload.get("type") != "refresh":
            raise HTTPException(status_code=403, detail="Invalid refresh token")

        email = refresh_payload["sub"]

        # access token rotation
        new_access = create_access_token({"sub": email})
        response.set_cookie(
            key="access_token",
            value=new_access,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=15 * 60,
            path="/",
        )

    # file validation
    if not avatar.content_type or not avatar.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    data = await avatar.read()

    if len(data) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 2MB)")

    encoded = base64.b64encode(data).decode("utf-8")

    await db.users.update_one(
        {"email": email},
        {"$set": {"avatarData": encoded, "avatarMime": avatar.content_type}},
    )

    logger.info(f"[AUTH] avatar uploaded email={email} mime={avatar.content_type} bytes={len(data)}")

    avatar_url = f"data:{avatar.content_type};base64,{encoded}"
    return {"msg": "Avatar updated", "avatarUrl": avatar_url}


#Update name & email
@router.patch("/me", response_model=UserOut)
async def patch_me(
    payload: UserUpdate,
    request: Request,
    response: Response,
    email: str = Depends(get_current_user_email),
):
    def make_avatar_url(user: dict | None) -> str | None:
        if not user:
            return None
        data = user.get("avatarData")
        mime = user.get("avatarMime")
        if not data or not mime:
            return None
        return f"data:{mime};base64,{data}"

    db = request.app.state.db

    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_doc = {}

    if payload.name is not None:
        name = payload.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name cannot be empty")
        update_doc["name"] = name

    new_email = None
    if payload.email is not None:
        new_email = payload.email.lower().strip()

        if not new_email:
            raise HTTPException(status_code=400, detail="Invalid email")

        if new_email != email:
            existing = await db.users.find_one({"email": new_email})
            if existing:
                raise HTTPException(status_code=409, detail="Email already exists")

            update_doc["email"] = new_email

    if not update_doc:
        return {
            "email": email,
            "name": user.get("name"),
            "avatarUrl": make_avatar_url(user),
        }

    await db.users.update_one({"email": email}, {"$set": update_doc})

    final_email = new_email or email

    if new_email and new_email != email:
        new_access = create_access_token({"sub": final_email})
        new_refresh = create_refresh_token({"sub": final_email})

        response.set_cookie(
            key="access_token",
            value=new_access,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=15 * 60,
            path="/",
        )

        response.set_cookie(
            key="refresh_token",
            value=new_refresh,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=7 * 24 * 60 * 60,
            path="/",
        )

    updated = await db.users.find_one({"email": final_email})

    return {
        "email": final_email,
        "name": updated.get("name"),
        "avatarUrl": make_avatar_url(updated),
    }

# Password Change
@router.patch("/me/password")
async def patch_me_password(
    payload: UserPasswordUpdate,
    request: Request,
    response: Response,
    email: str = Depends(get_current_user_email),
):
    db = request.app.state.db

    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing_hash = user.get("password")
    if not existing_hash:
        raise HTTPException(status_code=400, detail="Password not set for this account")

    if not verify_password(payload.currentPassword, existing_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if payload.currentPassword == payload.newPassword:
        raise HTTPException(status_code=400, detail="New password must be different")

    new_hash = hash_password(payload.newPassword)
    await db.users.update_one({"email": email}, {"$set": {"password": new_hash}})

    new_access = create_access_token({"sub": email})
    new_refresh = create_refresh_token({"sub": email})

    response.set_cookie(
        key="access_token",
        value=new_access,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=new_refresh,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_TIME * 60 * 60,
        path="/",
    )

    logger.info(f"[AUTH] password updated email={email}")
    return {"message": "Password updated successfully"}