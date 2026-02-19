from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from datetime import datetime, timedelta, timezone
from fastapi.responses import RedirectResponse

from app.schemas.url_schemas import ShortenRequest, ShortenResponse, UrlInfo
from ..utils import generate_short_id
from app.config import settings
from app.core.logger import logger  # ✅ ADD THIS

router = APIRouter(prefix="/api/url", tags=["urls"])
redirect_router = APIRouter(tags=["redirect"])
REDIRECT_PREFIX = "/r"


def get_db(request: Request):
    db = getattr(request.app.state, "db", None)
    if db is None:
        logger.error("[URL] DB not ready: request.app.state.db missing")
        raise HTTPException(status_code=503, detail="Database not initialized")
    return db


@router.post("/shorten", response_model=ShortenResponse)
async def create_short_url(payload: ShortenRequest, request: Request, db=Depends(get_db)):
    logger.info(
        f"[URL] shorten request "
        f"alias={'yes' if payload.alias else 'no'} "
        f"longUrl={str(payload.longUrl)[:80]}"
    )

    if payload.alias:
        exists = await db.urls.find_one({"shortId": payload.alias})
        if exists:
            logger.warning(f"[URL] shorten failed alias_in_use alias={payload.alias}")
            raise HTTPException(status_code=409, detail="Alias already in use")
        short_id = payload.alias
        logger.info(f"[URL] shorten using alias shortId={short_id}")
    else:
        short_id = None
        for attempt in range(1, 6):
            candidate = generate_short_id()
            exists = await db.urls.find_one({"shortId": candidate})
            if not exists:
                short_id = candidate
                logger.info(f"[URL] shorten generated shortId={short_id} attempt={attempt}")
                break

        if not short_id:
            logger.error("[URL] shorten failed: could not generate unique id after 5 attempts")
            raise HTTPException(status_code=500, detail="Failed to generate unique id")

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=settings.URL_EXPIRY_DAYS)

    doc = {
        "shortId": short_id,
        "longUrl": str(payload.longUrl),
        "createdAt": now,
        "expiresAt": expires_at,
        "clicks": 0,
        "lastAccessed": None,
    }

    res = await db.urls.insert_one(doc)

    short_url = f"{settings.BASE_URL}{REDIRECT_PREFIX}/{short_id}"
    logger.info(f"[URL] shorten success shortId={short_id} db_id={res.inserted_id} shortUrl={short_url}")

    return ShortenResponse(shortId=short_id, shortUrl=short_url)


@router.get("/info/{shortId}", response_model=UrlInfo)
async def get_info(shortId: str, request: Request, db=Depends(get_db)):
    logger.info(f"[URL] info request shortId={shortId}")

    doc = await db.urls.find_one({"shortId": shortId}, {"_id": 0})
    if not doc:
        logger.warning(f"[URL] info not found shortId={shortId}")
        raise HTTPException(status_code=404, detail="Not found")

    logger.info(f"[URL] info success shortId={shortId} clicks={doc.get('clicks', 0)}")
    return UrlInfo(**doc)


@router.delete("/delete/{shortId}")
async def delete_short(shortId: str, request: Request, db=Depends(get_db)):
    logger.info(f"[URL] delete request shortId={shortId}")

    res = await db.urls.delete_one({"shortId": shortId})
    if res.deleted_count == 0:
        logger.warning(f"[URL] delete not found shortId={shortId}")
        raise HTTPException(status_code=404, detail="Not found")

    logger.info(f"[URL] delete success shortId={shortId}")
    return {"ok": True}


@router.get("/links", response_model=List[UrlInfo])
async def list_links(
    request: Request,
    db=Depends(get_db),
    limit: int = Query(100, ge=1, le=500),
    q: Optional[str] = Query(None, description="Search in shortId or longUrl"),
    include_expired: bool = Query(True, description="Include expired links"),
):
    logger.info(
        f"[URL] list_links request limit={limit} "
        f"q={'yes' if q else 'no'} include_expired={include_expired}"
    )

    filt = {}

    if q:
        filt["$or"] = [
            {"shortId": {"$regex": q, "$options": "i"}},
            {"longUrl": {"$regex": q, "$options": "i"}},
        ]

    if not include_expired:
        now = datetime.now(timezone.utc)
        not_expired = {"$or": [{"expiresAt": {"$exists": False}}, {"expiresAt": {"$gt": now}}]}
        if filt:
            filt = {"$and": [filt, not_expired]}
        else:
            filt = not_expired

    cursor = db.urls.find(filt, {"_id": 0}).sort("createdAt", -1).limit(limit)
    items = await cursor.to_list(length=limit)

    for it in items:
        it["shortUrl"] = f"{settings.BASE_URL}{REDIRECT_PREFIX}/{it['shortId']}"

    logger.info(f"[URL] list_links success returned={len(items)}")
    return items


# --- REDIRECT ROUTE ---
@redirect_router.get("/r/{shortId}", include_in_schema=False)
async def redirect(shortId: str, request: Request):
    db = getattr(request.app.state, "db", None)
    if db is None:
        logger.error("[URL] redirect DB not ready: request.app.state.db missing")
        raise HTTPException(status_code=503, detail="Database not initialized")

    logger.info(f"[URL] redirect hit shortId={shortId}")

    doc = await db.urls.find_one({"shortId": shortId})
    if not doc:
        logger.warning(f"[URL] redirect not found shortId={shortId}")
        raise HTTPException(status_code=404, detail="Short URL not found")

    if doc.get("expiresAt") and doc["expiresAt"] <= datetime.now(timezone.utc):
        logger.warning(f"[URL] redirect expired shortId={shortId}")
        raise HTTPException(status_code=410, detail="This link has expired")

    await db.urls.update_one(
        {"shortId": shortId},
        {"$inc": {"clicks": 1}, "$set": {"lastAccessed": datetime.now(timezone.utc)}},
    )

    logger.info(f"[URL] redirect success shortId={shortId} -> {doc['longUrl'][:80]}")

    return RedirectResponse(url=doc["longUrl"], status_code=307)
