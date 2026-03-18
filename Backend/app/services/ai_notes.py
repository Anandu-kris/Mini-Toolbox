import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any

import httpx
from bson import ObjectId
from fastapi import HTTPException
from app.config import settings

EMBED_DIM = settings.EMBED_DIM


def sha256_text(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150) -> List[str]:
    text = (text or "").strip()
    if not text:
        return []

    chunks = []
    i = 0

    while i < len(text):
        end = min(len(text), i + chunk_size)
        chunks.append(text[i:end])

        if end == len(text):
            break

        i = max(0, end - overlap)

    return chunks


async def embed_texts(texts: List[str], api_key: str, model: str) -> List[List[float]]:
    if not texts:
        return []

    url = settings.OPENAI_EMBED_URL
    headers = {"Authorization": f"Bearer {api_key}"}
    payload = {"model": model, "input": texts}

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(url, headers=headers, json=payload)
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"OpenAI embeddings failed: {r.text}")
        data = r.json()

    vectors = [item["embedding"] for item in data["data"]]
    return vectors


def normalize_user_id(user_id: str | ObjectId) -> ObjectId:
    if isinstance(user_id, ObjectId):
        return user_id

    try:
        return ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")


async def upsert_note_chunks(
    db,
    *,
    user_id: str | ObjectId,
    note_id: str,
    title: str,
    content: str,
    api_key: str,
    embed_model: str,
):
    owner_id = normalize_user_id(user_id)

    source = f"{title.strip()}\n\n{(content or '').strip()}".strip()

    if not source:
        await db.note_chunks.delete_many({"userId": owner_id, "noteId": note_id})
        return

    content_hash = sha256_text(source)

    existing = await db.note_chunks.find_one(
        {
            "userId": owner_id,
            "noteId": note_id,
            "contentHash": content_hash,
        },
        {"_id": 1},
    )
    if existing:
        return

    await db.note_chunks.delete_many({"userId": owner_id, "noteId": note_id})

    chunks = chunk_text(source)
    vectors = await embed_texts(chunks, api_key=api_key, model=embed_model)

    now = datetime.now(timezone.utc)
    docs = []

    for idx, (txt, vec) in enumerate(zip(chunks, vectors)):
        docs.append(
            {
                "userId": owner_id,
                "noteId": note_id,
                "chunkIndex": idx,
                "text": txt,
                "embedding": vec,
                "contentHash": content_hash,
                "createdAt": now,
                "updatedAt": now,
            }
        )

    if docs:
        await db.note_chunks.insert_many(docs)


async def vector_search_chunks(
    db,
    *,
    user_id: str | ObjectId,
    query: str,
    api_key: str,
    embed_model: str,
    top_k: int = 6,
):
    owner_id = normalize_user_id(user_id)

    qvec = (await embed_texts([query], api_key=api_key, model=embed_model))[0]

    pipeline = [
        {
            "$vectorSearch": {
                "index": "note_chunks_embedding",
                "path": "embedding",
                "queryVector": qvec,
                "numCandidates": 100,
                "limit": top_k,
                "filter": {"userId": owner_id},
            }
        },
        {
            "$project": {
                "_id": 0,
                "noteId": 1,
                "chunkIndex": 1,
                "text": 1,
                "score": {"$meta": "vectorSearchScore"},
            }
        },
    ]

    cursor = db.note_chunks.aggregate(pipeline)
    return await cursor.to_list(length=top_k)


def build_prompt_context(chunks: List[Dict[str, Any]]) -> str:
    lines = []
    for c in chunks:
        lines.append(f"[noteId:{c['noteId']} chunk:{c['chunkIndex']}] {c['text']}")
    return "\n\n".join(lines)