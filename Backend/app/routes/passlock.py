from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime, timezone

from app.core.logger import logger
from app.deps.auth_deps import get_current_user_email
from app.schemas.passlock_schema import VaultSetupRequest, VaultMetaOut, VaultMetaPatch
from pymongo import ReturnDocument


router = APIRouter(prefix="/api/passlock", tags=["PassLock"])

def get_db(request: Request):
    db = getattr(request.app.state, "db", None)
    if db is None:
        raise HTTPException(status_code=503, detail="DB not ready")
    return db


def to_meta_out(doc) -> VaultMetaOut:
    return VaultMetaOut(
        kdf=doc["kdf"],
        kdfParams=doc["kdfParams"],
        salt=doc["salt"],
        encryptedVaultKey=doc["encryptedVaultKey"],
        vaultKeyIv=doc["vaultKeyIv"],
        vaultKeyAlg=doc.get("vaultKeyAlg", "A256GCM"),
        version=doc.get("version", 1),
        createdAt=doc["createdAt"].isoformat(),
        updatedAt=doc["updatedAt"].isoformat(),
    )


@router.get("/meta", response_model=VaultMetaOut)
async def get_vault_meta(
    request: Request,
    db=Depends(get_db),
):
    email = get_current_user_email(request)

    doc = await db.vault_meta.find_one({"userEmail": email})
    if not doc:
        raise HTTPException(status_code=404, detail="Vault not initialized")

    return to_meta_out(doc)


@router.post("/setup", response_model=VaultMetaOut)
async def setup_vault(
    payload: VaultSetupRequest,
    request: Request,
    db=Depends(get_db),
):
    email = get_current_user_email(request)
    now = datetime.now(timezone.utc)

    existing = await db.vault_meta.find_one({"userEmail": email})
    if existing:
        raise HTTPException(status_code=409, detail="Vault already initialized")

    doc = {
        "userEmail": email,
        "kdf": payload.kdf,
        "kdfParams": payload.kdfParams.model_dump(),
        "salt": payload.salt,
        "encryptedVaultKey": payload.encryptedVaultKey,
        "vaultKeyIv": payload.vaultKeyIv,
        "vaultKeyAlg": payload.vaultKeyAlg or "A256GCM",
        "version": payload.version or 1,
        "createdAt": now,
        "updatedAt": now,
    }

    await db.vault_meta.insert_one(doc)
    logger.info(f"[PASSLOCK] vault initialized user={email}")

    return to_meta_out(doc)

# @router.post("/rotate-vault-key", response_model=VaultMetaOut)
# async def rotate_vault_key(
#     payload: VaultSetupRequest,
#     request: Request,
#     db=Depends(get_db),
# ):
#     email = get_current_user_email(request)
#     now = datetime.now(timezone.utc)

#     res = await db.vault_meta.find_one_and_update(
#         {"userEmail": email},
#         {
#             "$set": {
#                 "kdf": payload.kdf,
#                 "kdfParams": payload.kdfParams.model_dump(),
#                 "salt": payload.salt,
#                 "encryptedVaultKey": payload.encryptedVaultKey,
#                 "vaultKeyIv": payload.vaultKeyIv,
#                 "vaultKeyAlg": payload.vaultKeyAlg or "A256GCM",
#                 "version": payload.version or 1,
#                 "updatedAt": now,
#             }
#         },
#         return_document=ReturnDocument.AFTER
#     )

#     if not res:
#         raise HTTPException(status_code=404, detail="Vault not initialized")

#     logger.info(f"[PASSLOCK] vault key rotated user={email}")
#     return to_meta_out(res)

@router.patch("/meta")
async def patch_vault_meta(
    payload: VaultMetaPatch,
    request: Request,
    db=Depends(get_db),
):
    email = get_current_user_email(request)
    now = datetime.now(timezone.utc)

    existing = await db.vault_meta.find_one({"userEmail": email})
    if not existing:
        raise HTTPException(status_code=404, detail="Vault not set up")

    if payload.expectedVersion is not None and payload.expectedVersion != existing.get("version"):
        raise HTTPException(status_code=409, detail="Vault meta version conflict")

    update = {
        "kdf": payload.kdf,
        "kdfParams": payload.kdfParams.model_dump(),
        "salt": payload.salt,
        "encryptedVaultKey": payload.encryptedVaultKey,
        "vaultKeyIv": payload.vaultKeyIv,
        "vaultKeyAlg": payload.vaultKeyAlg,
        "version": int(existing.get("version", 1)) + 1,
        "updatedAt": now,
    }

    doc = await db.passlock_meta.find_one_and_update(
        {"userEmail": email},
        {"$set": update},
        return_document=ReturnDocument.AFTER,
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Vault not set up")

    return to_meta_out(doc)