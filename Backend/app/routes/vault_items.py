from fastapi import APIRouter, Depends, HTTPException, Request, Query
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId
from pymongo import ReturnDocument

from app.schemas.vault_items_schema import (
    VaultItemCreate,
    VaultItemUpdate,
    VaultItemOut,
)
from app.deps.auth_deps import get_current_user_email
from app.core.logger import logger


router = APIRouter(prefix="/api/passlock/items", tags=["PassLock Items"])

def get_db(request: Request):
    db = getattr(request.app.state, "db", None)
    if db is None:
        raise HTTPException(status_code=503, detail="DB not ready")
    return db


def to_out(doc) -> VaultItemOut:
    return VaultItemOut(
        id=str(doc["_id"]),
        name=doc["name"],
        username=doc.get("username"),
        url=doc.get("url"),
        folder=doc.get("folder"),
        favorite=doc.get("favorite", False),
        ciphertext=doc["ciphertext"],
        iv=doc["iv"],
        createdAt=doc["createdAt"],
        updatedAt=doc["updatedAt"],
    )


# ---------------- CREATE ----------------

@router.post("", response_model=VaultItemOut)
async def create_item(
    payload: VaultItemCreate,
    request: Request,
    db=Depends(get_db),
):
    email = get_current_user_email(request)
    now = datetime.now(timezone.utc)

    doc = {
        "userEmail": email,
        "name": payload.name.strip(),
        "username": payload.username,
        "url": payload.url,
        "folder": payload.folder,
        "favorite": payload.favorite or False,
        "ciphertext": payload.ciphertext,
        "iv": payload.iv,
        "createdAt": now,
        "updatedAt": now,
    }

    res = await db.vault_items.insert_one(doc)
    doc["_id"] = res.inserted_id

    logger.info(f"[PASSLOCK] create item user={email} id={doc['_id']}")
    return to_out(doc)


# ---------------- LIST ----------------

@router.get("", response_model=List[VaultItemOut])
async def list_items(
    request: Request,
    db=Depends(get_db),
    folder: Optional[str] = Query(None),
    favorite: Optional[bool] = Query(None),
):
    email = get_current_user_email(request)

    filt = {"userEmail": email}

    if folder is not None:
        filt["folder"] = folder

    if favorite is not None:
        filt["favorite"] = favorite

    cursor = (
        db.vault_items.find(filt)
        .sort([("favorite", -1), ("updatedAt", -1)])
    )

    items = await cursor.to_list(length=500)

    logger.info(f"[PASSLOCK] list items user={email} count={len(items)}")
    return [to_out(d) for d in items]


# ---------------- GET ONE ----------------

@router.get("/{item_id}", response_model=VaultItemOut)
async def get_item(
    item_id: str,
    request: Request,
    db=Depends(get_db),
):
    email = get_current_user_email(request)

    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid item id")

    doc = await db.vault_items.find_one(
        {"_id": oid, "userEmail": email}
    )

    if not doc:
        raise HTTPException(status_code=404, detail="Item not found")

    return to_out(doc)


# ---------------- UPDATE ----------------

@router.patch("/{item_id}", response_model=VaultItemOut)
async def update_item(
    item_id: str,
    payload: VaultItemUpdate,
    request: Request,
    db=Depends(get_db),
):
    email = get_current_user_email(request)

    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid item id")

    update = {}

    if payload.name is not None:
        update["name"] = payload.name.strip()

    if payload.username is not None:
        update["username"] = payload.username

    if payload.url is not None:
        update["url"] = payload.url

    if payload.folder is not None:
        update["folder"] = payload.folder

    if payload.favorite is not None:
        update["favorite"] = payload.favorite

    if payload.ciphertext is not None:
        update["ciphertext"] = payload.ciphertext

    if payload.iv is not None:
        update["iv"] = payload.iv

    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")

    update["updatedAt"] = datetime.now(timezone.utc)

    doc = await db.vault_items.find_one_and_update(
        {"_id": oid, "userEmail": email},
        {"$set": update},
        return_document=ReturnDocument.AFTER
    )

    if not doc:
        raise HTTPException(status_code=404, detail="Item not found")

    logger.info(f"[PASSLOCK] update item user={email} id={item_id}")
    return to_out(doc)


# ---------------- DELETE ----------------

@router.delete("/{item_id}")
async def delete_item(
    item_id: str,
    request: Request,
    db=Depends(get_db),
):
    email = get_current_user_email(request)

    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid item id")

    res = await db.vault_items.delete_one(
        {"_id": oid, "userEmail": email}
    )

    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")

    logger.info(f"[PASSLOCK] delete item user={email} id={item_id}")
    return {"ok": True}