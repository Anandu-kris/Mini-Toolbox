# app/routes/notes.py
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from pymongo import ReturnDocument


from app.schemas.notes_schema import NoteCreate, NoteUpdate, NoteOut
from app.deps.auth_deps import get_current_user_email
from app.core.logger import logger
from app.util.html_text import html_to_text

router = APIRouter(prefix="/api/notes", tags=["Notes"])


def get_db(request: Request):
    db = getattr(request.app.state, "db", None)
    if db is None:
        logger.error("DB not ready: request.app.state.db missing")
        raise HTTPException(status_code=503, detail="DB not ready")
    return db


def to_note_out(doc) -> NoteOut:
    return NoteOut(
        id=str(doc["_id"]),
        title=doc["title"],
        contentHtml=doc.get("contentHtml", ""),
        contentText=doc.get("contentText", ""), 
        tags=doc.get("tags", []),
        pinned=doc.get("pinned", False),
        isTrashed=doc.get("isTrashed", False),
        createdAt=doc["createdAt"],
        updatedAt=doc["updatedAt"],
    )


@router.post("/create", response_model=NoteOut)
async def create_note(
    payload: NoteCreate,
    request: Request,
    db=Depends(get_db),
):
    email = get_current_user_email(request)
    now = datetime.now(timezone.utc)

    logger.info(
        f"[NOTES] create_note user={email} "
        f"title_len={len(payload.title or '')} tags_count={len(payload.tags or [])} pinned={payload.pinned}"
    )

    doc = {
        "userEmail": email,
        "title": payload.title.strip(),
        "contentHtml": payload.contentHtml,
        "contentText": html_to_text(payload.contentHtml),
        "tags": [t.strip() for t in payload.tags if t.strip()],
        "pinned": payload.pinned,
        "createdAt": now,
        "updatedAt": now,
        "isTrashed": False,
        "trashedAt": None,
    }

    res = await db.notes.insert_one(doc)
    doc["_id"] = res.inserted_id

    logger.info(f"[NOTES] created note_id={doc['_id']} user={email}")
    return to_note_out(doc)


@router.get("", response_model=List[NoteOut])
async def list_notes(
    request: Request,
    db=Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    q: Optional[str] = Query(None, description="Search in title/contentHtml/tags"),
    pinned: Optional[bool] = Query(None),
    tag: Optional[str] = Query(None, description="Filter by single tag"),
    trashed: Optional[bool] = Query(False),
):
    email = get_current_user_email(request)

    logger.info(
        f"[NOTES] list_notes user={email} limit={limit} skip={skip} "
        f"q={'yes' if q else 'no'} pinned={pinned} tag={tag} trashed={trashed}"
    )

    filt = {"userEmail": email}

    if pinned is not None:
        filt["pinned"] = pinned

    if tag:
        filt["tags"] = tag.strip()

    if trashed is not None:
        filt["isTrashed"] = trashed

    if q:
        q = q.strip()
        filt["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"contentText": {"$regex": q, "$options": "i"}},
            {"tags": {"$elemMatch": {"$regex": q, "$options": "i"}}},
        ]

    cursor = (
        db.notes.find(filt)
        .sort([("pinned", -1), ("updatedAt", -1)])
        .skip(skip)
        .limit(limit)
    )

    items = await cursor.to_list(length=limit)
    logger.info(f"[NOTES] list_notes user={email} returned={len(items)}")
    return [to_note_out(d) for d in items]


@router.get("/{note_id}", response_model=NoteOut)
async def get_note(
    note_id: str,
    request: Request,
    db=Depends(get_db),
):
    email = get_current_user_email(request)
    logger.info(f"[NOTES] get_note user={email} note_id={note_id}")

    try:
        oid = ObjectId(note_id)
    except Exception:
        logger.warning(f"[NOTES] get_note invalid note_id={note_id} user={email}")
        raise HTTPException(status_code=400, detail="Invalid note id")

    doc = await db.notes.find_one({"_id": oid, "userEmail": email})
    if not doc:
        logger.warning(f"[NOTES] get_note not found note_id={note_id} user={email}")
        raise HTTPException(status_code=404, detail="Note not found")

    return to_note_out(doc)


@router.patch("/{note_id}", response_model=NoteOut)
async def update_note(
    note_id: str,
    payload: NoteUpdate,
    request: Request,
    db=Depends(get_db),
):
    email = get_current_user_email(request)
    logger.info(f"[NOTES] update_note user={email} note_id={note_id}")

    try:
        oid = ObjectId(note_id)
    except Exception:
        logger.warning(f"[NOTES] update_note invalid note_id={note_id} user={email}")
        raise HTTPException(status_code=400, detail="Invalid note id")

    update = {}

    if payload.title is not None:
        update["title"] = payload.title.strip()
    if payload.contentHtml is not None:
        update["contentHtml"] = payload.contentHtml
        update["contentText"] = html_to_text(payload.contentHtml)
    if payload.tags is not None:
        update["tags"] = [t.strip() for t in payload.tags if t.strip()]
    if payload.pinned is not None:
        update["pinned"] = payload.pinned
    if payload.isTrashed is not None:
        update["isTrashed"] = payload.isTrashed

    if not update:
        logger.warning(f"[NOTES] update_note no fields user={email} note_id={note_id}")
        raise HTTPException(status_code=400, detail="No fields to update")

    update["updatedAt"] = datetime.now(timezone.utc)

    logger.info(
        f"[NOTES] update_note apply user={email} note_id={note_id} fields={list(update.keys())}"
    )

    res = await db.notes.find_one_and_update(
        {"_id": oid, "userEmail": email},
        {"$set": update},
        return_document=ReturnDocument.AFTER,
    )

    if not res:
        logger.warning(f"[NOTES] update_note not found user={email} note_id={note_id}")
        raise HTTPException(status_code=404, detail="Note not found")

    logger.info(f"[NOTES] update_note success user={email} note_id={note_id}")
    return to_note_out(res)


@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    request: Request,
    db=Depends(get_db),
):
    email = get_current_user_email(request)
    logger.info(f"[NOTES] delete_note user={email} note_id={note_id}")

    try:
        oid = ObjectId(note_id)
    except Exception:
        logger.warning(f"[NOTES] delete_note invalid note_id={note_id} user={email}")
        raise HTTPException(status_code=400, detail="Invalid note id")

    res = await db.notes.delete_one({"_id": oid, "userEmail": email})
    if res.deleted_count == 0:
        logger.warning(f"[NOTES] delete_note not found user={email} note_id={note_id}")
        raise HTTPException(status_code=404, detail="Note not found")

    logger.info(f"[NOTES] delete_note success user={email} note_id={note_id}")
    return {"ok": True}
