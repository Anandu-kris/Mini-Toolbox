from fastapi import APIRouter, Depends, HTTPException, Request, Query
from datetime import datetime, timezone
from typing import List, Optional
from bson import ObjectId
from pymongo import ReturnDocument

from app.schemas.notes_schema import NoteCreate, NoteUpdate, NoteOut
from app.deps.auth_deps import get_current_user
from app.core.logger import logger
from app.util.html_text import html_to_text
from app.config import settings

from app.services.ai_notes import upsert_note_chunks

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

# Create Note
@router.post("/create", response_model=NoteOut)
async def create_note(
    payload: NoteCreate,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    user_id = current_user["_id"]
    user_email = current_user.get("userEmail") or current_user.get("email")

    title = (payload.title or "").strip()
    content_html = payload.contentHtml or ""
    content_text = html_to_text(content_html)

    logger.info(
        f"[NOTES] create_note userId={str(user_id)} title_len={len(title)} "
        f"tags_count={len(payload.tags or [])} pinned={payload.pinned}"
    )

    doc = {
        "userId": user_id,
        "title": title,
        "contentHtml": content_html,
        "contentText": content_text,
        "tags": [t.strip() for t in (payload.tags or []) if t.strip()],
        "pinned": payload.pinned,
        "createdAt": now,
        "updatedAt": now,
        "isTrashed": False,
        "trashedAt": None,
    }

    res = await db.notes.insert_one(doc)
    doc["_id"] = res.inserted_id

    try:
        await upsert_note_chunks(
            db,
            user_id=str(user_id),
            note_id=str(doc["_id"]),
            title=doc["title"],
            content=doc.get("contentText", "") or "",
            api_key=settings.OPENAI_API_KEY,
            embed_model=settings.OPENAI_EMBED_MODEL,
        )
    except Exception as e:
        logger.exception(
            f"[AI] upsert_note_chunks failed on create note_id={doc['_id']} userId={str(user_id)}: {e}"
        )

    logger.info(f"[NOTES] created note_id={doc['_id']} userId={str(user_id)}")
    return to_note_out(doc)

# List Notes
@router.get("", response_model=List[NoteOut])
async def list_notes(
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    q: Optional[str] = Query(None, description="Search in title/contentHtml/tags"),
    pinned: Optional[bool] = Query(None),
    tag: Optional[str] = Query(None, description="Filter by single tag"),
    trashed: Optional[bool] = Query(False),
):
    user_id = current_user["_id"]

    logger.info(
        f"[NOTES] list_notes userId={str(user_id)} limit={limit} skip={skip} "
        f"q={'yes' if q else 'no'} pinned={pinned} tag={tag} trashed={trashed}"
    )

    filt = {"userId": user_id}

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
    logger.info(f"[NOTES] list_notes userId={str(user_id)} returned={len(items)}")
    return [to_note_out(d) for d in items]

# Fetch Speicifc Note
@router.get("/{note_id}", response_model=NoteOut)
async def get_note(
    note_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["_id"]
    logger.info(f"[NOTES] get_note userId={str(user_id)} note_id={note_id}")

    try:
        oid = ObjectId(note_id)
    except Exception:
        logger.warning(f"[NOTES] get_note invalid note_id={note_id} userId={str(user_id)}")
        raise HTTPException(status_code=400, detail="Invalid note id")

    doc = await db.notes.find_one({"_id": oid, "userId": user_id})
    if not doc:
        logger.warning(f"[NOTES] get_note not found note_id={note_id} userId={str(user_id)}")
        raise HTTPException(status_code=404, detail="Note not found")

    return to_note_out(doc)

# Update Note
@router.patch("/{note_id}", response_model=NoteOut)
async def update_note(
    note_id: str,
    payload: NoteUpdate,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["_id"]
    logger.info(f"[NOTES] update_note userId={str(user_id)} note_id={note_id}")

    try:
        oid = ObjectId(note_id)
    except Exception:
        logger.warning(f"[NOTES] update_note invalid note_id={note_id} userId={str(user_id)}")
        raise HTTPException(status_code=400, detail="Invalid note id")

    update = {}

    if payload.title is not None:
        update["title"] = payload.title.strip()

    if payload.contentHtml is not None:
        update["contentHtml"] = payload.contentHtml
        update["contentText"] = html_to_text(payload.contentHtml or "")

    if payload.tags is not None:
        update["tags"] = [t.strip() for t in payload.tags if t.strip()]

    if payload.pinned is not None:
        update["pinned"] = payload.pinned

    if payload.isTrashed is not None:
        update["isTrashed"] = payload.isTrashed
        update["trashedAt"] = datetime.now(timezone.utc) if payload.isTrashed else None

    if not update:
        logger.warning(f"[NOTES] update_note no fields userId={str(user_id)} note_id={note_id}")
        raise HTTPException(status_code=400, detail="No fields to update")

    update["updatedAt"] = datetime.now(timezone.utc)

    logger.info(
        f"[NOTES] update_note apply userId={str(user_id)} note_id={note_id} fields={list(update.keys())}"
    )

    res = await db.notes.find_one_and_update(
        {"_id": oid, "userId": user_id},
        {"$set": update},
        return_document=ReturnDocument.AFTER,
    )

    if not res:
        logger.warning(f"[NOTES] update_note not found userId={str(user_id)} note_id={note_id}")
        raise HTTPException(status_code=404, detail="Note not found")

    try:
        is_trashed = bool(res.get("isTrashed", False))
        if is_trashed:
            await db.note_chunks.delete_many({"userId": user_id, "noteId": str(res["_id"])})
        else:
            await upsert_note_chunks(
                db,
                user_id=str(user_id),
                note_id=str(res["_id"]),
                title=res.get("title", "") or "",
                content=res.get("contentText", "") or "",
                api_key=settings.OPENAI_API_KEY,
                embed_model=settings.OPENAI_EMBED_MODEL,
            )
    except Exception as e:
        logger.exception(
            f"[AI] embedding sync failed on update note_id={note_id} userId={str(user_id)}: {e}"
        )

    logger.info(f"[NOTES] update_note success userId={str(user_id)} note_id={note_id}")
    return to_note_out(res)

# Delete Note
@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["_id"]
    logger.info(f"[NOTES] delete_note userId={str(user_id)} note_id={note_id}")

    try:
        oid = ObjectId(note_id)
    except Exception:
        logger.warning(f"[NOTES] delete_note invalid note_id={note_id} userId={str(user_id)}")
        raise HTTPException(status_code=400, detail="Invalid note id")

    res = await db.notes.delete_one({"_id": oid, "userId": user_id})
    if res.deleted_count == 0:
        logger.warning(f"[NOTES] delete_note not found userId={str(user_id)} note_id={note_id}")
        raise HTTPException(status_code=404, detail="Note not found")

    try:
        await db.note_chunks.delete_many({"userId": user_id, "noteId": note_id})
    except Exception as e:
        logger.exception(
            f"[AI] delete note_chunks failed note_id={note_id} userId={str(user_id)}: {e}"
        )

    logger.info(f"[NOTES] delete_note success userId={str(user_id)} note_id={note_id}")
    return {"ok": True}