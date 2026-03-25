import base64
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, Response, UploadFile, File

from app.auth.hash import hash_password, verify_password
from app.auth.jwt_handler import (
    create_access_token,
    create_refresh_token,
    create_mfa_token,
    verify_token,
)
from app.config import settings
from app.core.logger import logger
from app.deps.auth_deps import get_current_user, make_avatar_url
from app.deps.rate_limiter_deps import login_rate_limit
from app.schemas.auth_schemas import (
    UserSignup,
    UserLogin,
    MobileOtpRequest,
    TotpVerifySetup,
    TotpLoginVerify,
    MobileOtpVerify
)
from app.schemas.user_schemas import UserOut, UserUpdate, UserPasswordUpdate

from app.services.phone_verification_service import normalize_mobile_number

from app.services.twilio_verify_service import (
    send_sms_verification,
    verify_sms_code_or_raise,
)

from app.services.totp_service import (
    generate_totp_secret,
    build_totp_uri,
    generate_qr_code_data_url,
    verify_totp_code,
    encrypt_totp_secret,
    decrypt_totp_secret,
)
from app.services.notifications_service import emit_daily_welcome_if_needed

router = APIRouter(prefix="/auth", tags=["Auth"])


def get_db(request: Request):
    db = getattr(request.app.state, "db", None)
    if db is None:
        logger.error("[AUTH] DB not ready: request.app.state.db missing")
        raise HTTPException(status_code=503, detail="DB not ready")
    return db


def _refresh_cookie_max_age_seconds() -> int:
    return settings.JWT_REFRESH_TOKEN_EXPIRE_TIME * 24 * 60 * 60


def _set_auth_cookies(response: Response, user_id: str, auth_method: str):
    access_token = create_access_token(
        {
            "sub": user_id,
            "authMethod": auth_method,
        }
    )
    refresh_token = create_refresh_token(
        {
            "sub": user_id,
            "authMethod": auth_method,
        }
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # set True in production with HTTPS
        samesite="lax",
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # set True in production with HTTPS
        samesite="lax",
        max_age=_refresh_cookie_max_age_seconds(),
        path="/",
    )


def _set_mfa_cookie(response: Response, user_id: str, auth_method: str):
    mfa_token = create_mfa_token(
        {
            "sub": user_id,
            "authMethod": auth_method,
        }
    )

    response.set_cookie(
        key="mfa_token",
        value=mfa_token,
        httponly=True,
        secure=False,  # set True in production with HTTPS
        samesite="lax",
        max_age=10 * 60,
        path="/",
    )


def _clear_auth_cookies(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("mfa_token", path="/")


def _serialize_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("userEmail") or user.get("email"),
        "mobileNumber": user.get("mobileNumberE164"),
        "isEmailVerified": bool(user.get("isEmailVerified", False)),
        "isMobileVerified": bool(user.get("isMobileVerified", False)),
        "mfaEnabled": bool(user.get("mfaEnabled", False)),
        "avatarUrl": make_avatar_url(user),
    }


# Signup
@router.post("/signup")
async def signup(user: UserSignup, db=Depends(get_db)):
    email_lower = user.email.lower().strip()

    logger.info(f"[AUTH] signup attempt email={email_lower}")

    existing = await db.users.find_one(
        {
            "$or": [
                {"emailLower": email_lower},
                {"email": email_lower},  # legacy support
            ]
        }
    )
    if existing:
        logger.warning(f"[AUTH] signup failed (already exists) email={email_lower}")
        raise HTTPException(status_code=400, detail="User already exists")

    now = datetime.now(timezone.utc)
    hashed = hash_password(user.password)

    doc = {
        "name": user.name.strip(),
        "userEmail": email_lower,
        "emailLower": email_lower,
        "isEmailVerified": False,
        "mobileNumber": None,
        "mobileNumberE164": None,
        "isMobileVerified": False,
        "passwordHash": hashed,
        "oauthProviders": {},
        "mfaEnabled": False,
        "mfaMethods": [],
        "totpSecretEncrypted": None,
        "totpConfirmedAt": None,
        "status": "active",
        "createdAt": now,
        "updatedAt": now,
        "lastLoginAt": None,
        "avatarData": None,
        "avatarMime": None,
    }

    await db.users.insert_one(doc)

    logger.info(f"[AUTH] signup success email={email_lower}")
    return {"message": "User registered successfully"}


# Email + Password Login
@router.post(
    "/login",
    dependencies=[
        login_rate_limit(
            ip_capacity=10,
            ip_window_seconds=60,
            email_capacity=5,
            email_window_seconds=60,
        )
    ],
)
async def login(user: UserLogin, response: Response, db=Depends(get_db)):
    email_lower = user.email.lower().strip()
    logger.info(f"[AUTH] login attempt email={email_lower}")

    existing = await db.users.find_one(
        {
            "$or": [
                {"emailLower": email_lower},
                {"email": email_lower},  
            ]
        }
    )
    if not existing:
        logger.warning(f"[AUTH] login failed (email not found) email={email_lower}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    stored_hash = existing.get("passwordHash") or existing.get("password")
    if not stored_hash or not verify_password(user.password, stored_hash):
        logger.warning(f"[AUTH] login failed (wrong password) email={email_lower}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_id = str(existing["_id"])

    if existing.get("passwordHash") is None and existing.get("password"):
        await db.users.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "passwordHash": existing["password"],
                    "updatedAt": datetime.now(timezone.utc),
                },
                "$unset": {"password": ""},
            },
        )

    if existing.get("mfaEnabled"):

        _set_mfa_cookie(response, user_id=user_id, auth_method="password")

        logger.info(f"[AUTH] MFA required userId={user_id}")

        return {
            "message": "TOTP verification required",
            "requiresMfa": True,
        }

    _set_auth_cookies(response, user_id=user_id, auth_method="password")

    await db.users.update_one(
        {"_id": existing["_id"]},
        {"$set": {"lastLoginAt": datetime.now(timezone.utc)}},
    )
    
    await emit_daily_welcome_if_needed(
        db=db,
        user_id=user_id,
    )

    logger.info(f"[AUTH] login success userId={user_id}")
    return {
        "message": "Login successful",
        "requiresMfa": False,
        "email": existing.get("userEmail") or existing.get("email"),
    }


# Current user
@router.get("/me", response_model=UserOut)
async def get_me(request: Request, response: Response):
    db = request.app.state.db

    access = request.cookies.get("access_token")
    refresh = request.cookies.get("refresh_token")

    logger.info(
        f"[AUTH] /me called has_access={'yes' if access else 'no'} has_refresh={'yes' if refresh else 'no'}"
    )

    payload = verify_token(access)
    if payload and payload.get("type") == "access":
        user_id = payload["sub"]
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return _serialize_user(user)

    if not refresh:
        raise HTTPException(status_code=403, detail="Not authenticated")

    refresh_payload = verify_token(refresh)
    if not refresh_payload or refresh_payload.get("type") != "refresh":
        raise HTTPException(status_code=403, detail="Invalid refresh token")

    user_id = refresh_payload["sub"]
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_access = create_access_token(
        {
            "sub": user_id,
            "authMethod": refresh_payload.get("authMethod") or "refresh",
        }
    )

    response.set_cookie(
        key="access_token",
        value=new_access,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    
    return _serialize_user(user)

# Mobile OTP Request
@router.post(
    "/mobile/request-otp",
    dependencies=[
        login_rate_limit(ip_capacity=5, ip_window_seconds=60)
    ],
)
async def request_mobile_login_otp(payload: MobileOtpRequest, db=Depends(get_db)):

    mobile = normalize_mobile_number(payload.mobileNumber)

    logger.info(f"[AUTH] mobile login lookup mobile={mobile}")

    user = await db.users.find_one(
        {
            "mobileNumberE164": mobile,
            "isMobileVerified": True,
            "$or": [
                {"status": "active"},
                {"status": {"$exists": False}},
            ],
        }
    )

    logger.info(f"[AUTH] mobile login found_user={'yes' if user else 'no'}")

    if user:
        await send_sms_verification(mobile)

    return {"message": "OTP sent if account exists"}

#OTP Verify
@router.post("/mobile/verify-otp")
async def verify_mobile_login_otp(
    payload: MobileOtpVerify,
    response: Response,
    db=Depends(get_db),
):

    mobile = normalize_mobile_number(payload.mobileNumber)

    user = await db.users.find_one(
        {
            "mobileNumberE164": mobile,
            "isMobileVerified": True,
            "$or": [
                {"status": "active"},
                {"status": {"$exists": False}},
            ],
        }
    )

    if not user:
        raise HTTPException(status_code=404, detail="No account found")

    await verify_sms_code_or_raise(mobile, payload.otpCode)

    user_id = str(user["_id"])

    _set_auth_cookies(response, user_id=user_id, auth_method="mobile_otp")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"lastLoginAt": datetime.now(timezone.utc)}},
    )
    
    await emit_daily_welcome_if_needed(
        db=db,
        user_id=str(user_id),
    )

    return {
        "message": "Login successful",
        "requiresMfa": False,
        "email": user.get("userEmail"),
    }

# Login OTP Request
@router.post("/me/mobile/request-otp")
async def request_link_mobile_otp(
    payload: MobileOtpRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):

    mobile = normalize_mobile_number(payload.mobileNumber)

    existing = await db.users.find_one(
        {
            "mobileNumberE164": mobile,
            "_id": {"$ne": current_user["_id"]},
        }
    )

    if existing:
        raise HTTPException(status_code=409, detail="Mobile number already linked")

    await send_sms_verification(mobile)

    return {"message": "OTP sent successfully"}

#Login OTP Verify
@router.post("/me/mobile/verify-otp", response_model=UserOut)
async def verify_link_mobile_otp(
    payload: MobileOtpVerify,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):

    mobile = normalize_mobile_number(payload.mobileNumber)

    await verify_sms_code_or_raise(mobile, payload.otpCode)

    await db.users.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "mobileNumber": mobile,
                "mobileNumberE164": mobile,
                "isMobileVerified": True,
                "updatedAt": datetime.now(timezone.utc),
            }
        },
    )

    updated = await db.users.find_one({"_id": current_user["_id"]})

    return _serialize_user(updated)

#MFA TOTP
@router.post("/me/mfa/totp/setup")
async def setup_totp(
    current_user: dict = Depends(get_current_user),
):

    secret = generate_totp_secret()

    uri = build_totp_uri(secret, current_user["userEmail"])

    qr = generate_qr_code_data_url(uri)

    return {
        "secret": secret,
        "otpauthUrl": uri,
        "qrCodeDataUrl": qr,
    }

#MFA TOTP Verify
@router.post("/me/mfa/totp/verify")
async def verify_totp_setup(
    payload: TotpVerifySetup,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):

    secret = request.headers.get("x-totp-secret")
    
    if not secret:
        raise HTTPException(status_code=400, detail="Missing TOTP secret")

    if not verify_totp_code(secret, payload.code):
        raise HTTPException(status_code=400, detail="Invalid code")

    encrypted = encrypt_totp_secret(secret)

    await db.users.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "totpSecretEncrypted": encrypted,
                "totpConfirmedAt": datetime.now(timezone.utc),
                "mfaEnabled": True,
                "mfaMethods": ["totp"],
                "updatedAt": datetime.now(timezone.utc),
            }
        },
    )

    return {"message": "TOTP MFA enabled"}


@router.post("/mfa/verify")
async def verify_mfa(
    payload: TotpLoginVerify,
    request: Request,
    response: Response,
    db=Depends(get_db),
):

    mfa_token = request.cookies.get("mfa_token")

    payload_token = verify_token(mfa_token)

    if not payload_token:
        raise HTTPException(status_code=401, detail="MFA session expired")

    user_id = payload_token["sub"]

    user = await db.users.find_one({"_id": ObjectId(user_id)})

    if not user or not user.get("totpSecretEncrypted"):
        raise HTTPException(status_code=400, detail="TOTP not configured")

    secret = decrypt_totp_secret(user["totpSecretEncrypted"])

    if not verify_totp_code(secret, payload.code):
        raise HTTPException(status_code=400, detail="Invalid TOTP code")

    auth_method = payload_token.get("authMethod")

    _set_auth_cookies(response, user_id, auth_method)

    response.delete_cookie("mfa_token")
    
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"lastLoginAt": datetime.now(timezone.utc)}},
    )

    return {"message": "MFA verification successful"}

# Logout
@router.post("/logout")
async def logout(response: Response):
    _clear_auth_cookies(response)
    logger.info("[AUTH] logout success cookies cleared")
    return {"message": "Logged out"}


# Avatar upload
@router.post("/avatar")
async def upload_avatar(
    request: Request,
    current_user: dict = Depends(get_current_user),
    avatar: UploadFile = File(...),
):
    db = request.app.state.db

    if not avatar.content_type or not avatar.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    data = await avatar.read()

    if len(data) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large (max 2MB)")

    encoded = base64.b64encode(data).decode("utf-8")

    await db.users.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "avatarData": encoded,
                "avatarMime": avatar.content_type,
                "updatedAt": datetime.now(timezone.utc),
            }
        },
    )

    avatar_url = f"data:{avatar.content_type};base64,{encoded}"
    logger.info(
        f"[AUTH] avatar uploaded userId={str(current_user['_id'])} mime={avatar.content_type} bytes={len(data)}"
    )
    return {"message": "Avatar updated", "avatarUrl": avatar_url}


# Update profile
@router.patch("/me", response_model=UserOut)
async def patch_me(
    payload: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    update_doc = {"updatedAt": datetime.now(timezone.utc)}

    if payload.name is not None:
        name = payload.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name cannot be empty")
        update_doc["name"] = name

    if payload.email is not None:
        new_email = payload.email.lower().strip()
        if not new_email:
            raise HTTPException(status_code=400, detail="Invalid email")

        current_email = current_user.get("userEmail") or current_user.get("email")
        if new_email != current_email:
            existing = await db.users.find_one(
                {
                    "emailLower": new_email,
                    "_id": {"$ne": current_user["_id"]},
                }
            )
            if existing:
                raise HTTPException(status_code=409, detail="Email already exists")

            update_doc["userEmail"] = new_email
            update_doc["emailLower"] = new_email
            update_doc["isEmailVerified"] = False

    if len(update_doc) == 1:
        return _serialize_user(current_user)

    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_doc},
    )

    updated = await db.users.find_one({"_id": current_user["_id"]})
    return _serialize_user(updated)


# Change password
@router.patch("/me/password")
async def patch_me_password(
    payload: UserPasswordUpdate,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    stored_hash = current_user.get("passwordHash") or current_user.get("password")
    if not stored_hash:
        raise HTTPException(status_code=400, detail="Password not set for this account")

    if not verify_password(payload.currentPassword, stored_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if payload.currentPassword == payload.newPassword:
        raise HTTPException(status_code=400, detail="New password must be different")

    new_hash = hash_password(payload.newPassword)

    await db.users.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "passwordHash": new_hash,
                "updatedAt": datetime.now(timezone.utc),
            },
            "$unset": {"password": ""},
        },
    )

    logger.info(f"[AUTH] password updated userId={str(current_user['_id'])}")
    return {"message": "Password updated successfully"}