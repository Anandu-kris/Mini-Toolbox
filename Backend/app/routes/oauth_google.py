from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from datetime import datetime, timezone

from app.config import settings
from app.auth.jwt_handler import create_access_token, create_refresh_token
from app.core.logger import logger  # ✅ ADD THIS

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


@router.get("/login")
async def google_login(request: Request):
    redirect_uri = settings.GOOGLE_REDIRECT_URI

    logger.info(f"[GOOGLE_OAUTH] login start redirect_uri={redirect_uri}")

    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/callback")
async def google_callback(request: Request, response: Response, db=Depends(get_db)):
    logger.info("[GOOGLE_OAUTH] callback hit: exchanging auth code for token")

    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        logger.error(f"[GOOGLE_OAUTH] authorize_access_token failed error={str(e)}")
        raise HTTPException(status_code=400, detail="Google OAuth failed")

    userinfo = token.get("userinfo")

    if not userinfo:
        logger.warning("[GOOGLE_OAUTH] callback failed: userinfo missing in token")
        raise HTTPException(status_code=400, detail="Failed to obtain user info from Google")

    email = userinfo.get("email")
    if not email:
        logger.warning("[GOOGLE_OAUTH] callback failed: email missing in userinfo")
        raise HTTPException(status_code=400, detail="Email not available in user info")

    logger.info(
        f"[GOOGLE_OAUTH] user authenticated email={email} "
        f"name={'yes' if userinfo.get('name') else 'no'} picture={'yes' if userinfo.get('picture') else 'no'}"
    )

    # Create / Update user in DB
    try:
        await db.users.update_one(
            {"email": email},
            {
                "$setOnInsert": {
                    "email": email,
                    "createdAt": datetime.now(timezone.utc),
                    "auth_provider": "google",
                },
                "$set": {
                    "lastLoginAt": datetime.now(timezone.utc),
                    "name": userinfo.get("name"),
                    "picture": userinfo.get("picture"),
                },
            },
            upsert=True,
        )
        logger.info(f"[GOOGLE_OAUTH] user upsert success email={email}")
    except Exception as e:
        logger.error(f"[GOOGLE_OAUTH] user upsert failed email={email} error={str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save user")

    # Issue JWT tokens
    access_token = create_access_token({"sub": email, "type": "access"})
    refresh_token = create_refresh_token({"sub": email, "type": "refresh"})

    logger.info(f"[GOOGLE_OAUTH] tokens issued email={email}")

    # Redirect to frontend
    redirect_url = f"{settings.FRONTEND_URL}/home"
    response = RedirectResponse(url=redirect_url, status_code=302)

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
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )

    logger.info(f"[GOOGLE_OAUTH] cookies set + redirect success email={email} redirect={redirect_url}")

    return response
