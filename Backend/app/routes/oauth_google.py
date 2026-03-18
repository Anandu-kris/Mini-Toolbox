from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth

from app.auth.jwt_handler import create_access_token, create_refresh_token, create_mfa_token
from app.config import settings
from app.core.logger import logger

router = APIRouter(prefix="/auth/google", tags=["OAuth"])

oauth = OAuth()

oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


def get_db(request: Request):
    db = getattr(request.app.state, "db", None)
    if db is None:
        logger.error("[GOOGLE_OAUTH] DB not ready: request.app.state.db missing")
        raise HTTPException(status_code=503, detail="DB not ready")
    return db


def _set_auth_cookies(response: RedirectResponse, user_id: str, auth_method: str):
    access_token = create_access_token({"sub": user_id, "authMethod": auth_method})
    refresh_token = create_refresh_token({"sub": user_id, "authMethod": auth_method})

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
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_TIME * 24 * 60 * 60,
        path="/",
    )


def _set_mfa_cookie(response: RedirectResponse, user_id: str, auth_method: str):
    mfa_token = create_mfa_token({"sub": user_id, "authMethod": auth_method})

    response.set_cookie(
        key="mfa_token",
        value=mfa_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=10 * 60,
        path="/",
    )


@router.get("/login")
async def google_login(request: Request):
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    logger.info(f"[GOOGLE_OAUTH] login start redirect_uri={redirect_uri}")
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/callback")
async def google_callback(request: Request, db=Depends(get_db)):
    logger.info("[GOOGLE_OAUTH] callback hit")

    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        logger.error(f"[GOOGLE_OAUTH] authorize_access_token failed error={str(e)}")
        raise HTTPException(status_code=400, detail="Google OAuth failed")

    userinfo = token.get("userinfo")
    if not userinfo:
        raise HTTPException(status_code=400, detail="Failed to obtain user info from Google")

    google_sub = userinfo.get("sub")
    email = userinfo.get("email")
    email_verified = bool(userinfo.get("email_verified", False))
    name = userinfo.get("name")
    picture = userinfo.get("picture")

    if not google_sub:
        raise HTTPException(status_code=400, detail="Google user id missing")

    email_lower = email.lower().strip() if email else None
    now = datetime.now(timezone.utc)

    user = await db.users.find_one({"oauthProviders.google.providerUserId": google_sub})

    if not user and email_lower:
        user = await db.users.find_one({"emailLower": email_lower})

    if user:
        update_doc = {
            "updatedAt": now,
            "lastLoginAt": now,
            "name": name or user.get("name"),
            "picture": picture or user.get("picture"),
            "oauthProviders.google": {
                "providerUserId": google_sub,
                "linkedAt": now,
            },
        }

        if email_lower and not user.get("userEmail"):
            update_doc["userEmail"] = email_lower
            update_doc["emailLower"] = email_lower

        if email_verified:
            update_doc["isEmailVerified"] = True

        await db.users.update_one({"_id": user["_id"]}, {"$set": update_doc})
        user = await db.users.find_one({"_id": user["_id"]})
    else:
        doc = {
            "name": name,
            "userEmail": email_lower,
            "emailLower": email_lower,
            "isEmailVerified": email_verified,
            "mobileNumber": None,
            "mobileNumberE164": None,
            "isMobileVerified": False,
            "passwordHash": None,
            "oauthProviders": {
                "google": {
                    "providerUserId": google_sub,
                    "linkedAt": now,
                }
            },
            "mfaEnabled": False,
            "mfaMethods": [],
            "status": "active",
            "createdAt": now,
            "updatedAt": now,
            "lastLoginAt": now,
            "avatarData": None,
            "avatarMime": None,
            "picture": picture,
        }

        result = await db.users.insert_one(doc)
        user = await db.users.find_one({"_id": result.inserted_id})

    user_id = str(user["_id"])

    if user.get("mfaEnabled") and user.get("isMobileVerified") and user.get("mobileNumberE164"):
        response = RedirectResponse(url=f"{settings.FRONTEND_URL}/auth/mfa", status_code=302)
        _set_mfa_cookie(response, user_id=user_id, auth_method="google")
        logger.info(f"[GOOGLE_OAUTH] MFA required userId={user_id}")
        return response

    response = RedirectResponse(url=f"{settings.FRONTEND_URL}/home", status_code=302)
    _set_auth_cookies(response, user_id=user_id, auth_method="google")

    logger.info(f"[GOOGLE_OAUTH] success userId={user_id}")
    return response