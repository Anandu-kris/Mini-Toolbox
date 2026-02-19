from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
import httpx
from app.config import settings
from app.deps.auth_deps import get_current_user_email
from app.services.ai_notes import vector_search_chunks, build_prompt_context

router = APIRouter(prefix="/api/ai", tags=["AI"])

def get_db(request: Request):
    db = getattr(request.app.state, "db", None)
    if db is None:
        raise HTTPException(status_code=503, detail="DB not ready")
    return db

class NotesCopilotRequest(BaseModel):
    query: str

class NotesCopilotResponse(BaseModel):
    answer: str
    sources: list

@router.post("/notes", response_model=NotesCopilotResponse)
async def notes_copilot(payload: NotesCopilotRequest, request: Request, db=Depends(get_db)):
    user_email = get_current_user_email(request)
    q = payload.query.strip()
    if not q:
        raise HTTPException(status_code=400, detail="Query required")

    chunks = await vector_search_chunks(
        db,
        user_email=user_email,
        query=q,
        api_key=settings.OPENAI_API_KEY,
        embed_model=settings.OPENAI_EMBED_MODEL,
        top_k=6,
    )

    context = build_prompt_context(chunks)

    # cheap chat call
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
    body = {
        "model": settings.OPENAI_CHAT_MODEL,
        "messages": [
            {"role": "system", "content": "You are Notes Copilot. Use ONLY the provided context. If the answer isn't in context, say you don't know."},
            {"role": "user", "content": f"QUESTION:\n{q}\n\nCONTEXT:\n{context}"},
        ],
        "temperature": 0.2,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(url, headers=headers, json=body)
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"OpenAI chat failed: {r.text}")
        data = r.json()

    answer = data["choices"][0]["message"]["content"]
    return {"answer": answer, "sources": chunks}
