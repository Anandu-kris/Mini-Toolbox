import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any

import httpx
from fastapi import HTTPException

EMBED_DIM = 1536  # text-embedding-3-small dims (store this alongside your index)

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
    url = "https://api.openai.com/v1/embeddings"
    headers = {"Authorization": f"Bearer {api_key}"}
    payload = {"model": model, "input": texts}

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(url, headers=headers, json=payload)
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"OpenAI embeddings failed: {r.text}")
        data = r.json()

    # OpenAI returns list in "data"
    vectors = [item["embedding"] for item in data["data"]]
    return vectors

async def upsert_note_chunks(
    db,
    *,
    user_email: str,
    note_id: str,
    title: str,
    content: str,
    api_key: str,
    embed_model: str,
):
    # 1) build the "embed source"
    source = f"{title.strip()}\n\n{(content or '').strip()}".strip()
    if not source:
        # empty note -> just delete chunks
        await db.note_chunks.delete_many({"userEmail": user_email, "noteId": note_id})
        return

    content_hash = sha256_text(source)

    # 2) skip if already embedded for this content_hash
    existing = await db.note_chunks.find_one(
        {"userEmail": user_email, "noteId": note_id, "contentHash": content_hash},
        {"_id": 1},
    )
    if existing:
        return

    # 3) delete old chunks (simple approach)
    await db.note_chunks.delete_many({"userEmail": user_email, "noteId": note_id})

    # 4) chunk + embed
    chunks = chunk_text(source)
    vectors = await embed_texts(chunks, api_key=api_key, model=embed_model)

    now = datetime.now(timezone.utc)
    docs = []
    for idx, (txt, vec) in enumerate(zip(chunks, vectors)):
        docs.append({
            "userEmail": user_email,
            "noteId": note_id,
            "chunkIndex": idx,
            "text": txt,
            "embedding": vec,
            "contentHash": content_hash,
            "createdAt": now,
            "updatedAt": now,
        })

    if docs:
        await db.note_chunks.insert_many(docs)

async def vector_search_chunks(
    db,
    *,
    user_email: str,
    query: str,
    api_key: str,
    embed_model: str,
    top_k: int = 6,
):
    qvec = (await embed_texts([query], api_key=api_key, model=embed_model))[0]

    pipeline = [
        {
            "$vectorSearch": {
                "index": "note_chunks_embedding", 
                "path": "embedding",
                "queryVector": qvec,
                "numCandidates": 100,
                "limit": top_k,
                "filter": {"userEmail": user_email},
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
    # keep it compact
    lines = []
    for c in chunks:
        lines.append(f"[noteId:{c['noteId']} chunk:{c['chunkIndex']}] {c['text']}")
    return "\n\n".join(lines)
