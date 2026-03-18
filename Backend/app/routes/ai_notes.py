from __future__ import annotations

from typing import Any, Dict

import httpx
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request

from app.config import settings
from app.deps.ai_deps import rl_dep, log_ai_event, Timer
from app.deps.auth_deps import get_current_user
from app.services.ai_notes import vector_search_chunks, build_prompt_context
from app.schemas.ai_notes_schema import (
    NotesCopilotRequest,
    NotesCopilotResponse,
    NoteActionResponse,
)
from app.config import settings

router = APIRouter(prefix="/api/ai", tags=["AI"])


def get_db(request: Request):
    db = getattr(request.app.state, "db", None)
    if db is None:
        raise HTTPException(status_code=503, detail="DB not ready")
    return db


def clamp_text(s: str, max_chars: int) -> str:
    s = (s or "").strip()
    if len(s) <= max_chars:
        return s
    return s[:max_chars] + "\n\n[TRUNCATED]"


async def openai_chat(*, system: str, user: str) -> str:
    url = settings.OPENAI_CHAT_URL
    headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
    body = {
        "model": settings.OPENAI_CHAT_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.2,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(url, headers=headers, json=body)
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"OpenAI chat failed: {r.text}")
        data = r.json()

    return data["choices"][0]["message"]["content"]


async def get_note_or_404(db, *, user_id: ObjectId, note_id: str) -> Dict[str, Any]:
    try:
        oid = ObjectId(note_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid note id")

    doc = await db.notes.find_one({"_id": oid, "userId": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Note not found")

    if doc.get("isTrashed", False):
        raise HTTPException(status_code=400, detail="Note is trashed")

    return doc


@router.post(
    "/notes",
    response_model=NotesCopilotResponse,
    dependencies=[Depends(rl_dep("copilot", 20, 60))],
)
async def notes_copilot(
    payload: NotesCopilotRequest,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    t = Timer()
    user_id = current_user["_id"]
    q = (payload.query or "").strip()

    if not q:
        raise HTTPException(status_code=400, detail="Query required")

    if len(q) > settings.MAX_QUERY_CHARS:
        raise HTTPException(status_code=400, detail="Query too long")

    top_k = min(max(int(payload.top_k or settings.COPILOT_TOP_K), 1), settings.COPILOT_TOP_K_MAX)

    try:
        chunks = await vector_search_chunks(
            db,
            user_id=user_id,
            query=q,
            api_key=settings.OPENAI_API_KEY,
            embed_model=settings.OPENAI_EMBED_MODEL,
            top_k=top_k,
        )

        context = build_prompt_context(chunks)

        system = (
            "You are Notes Copilot.\n"
            "Use ONLY the provided context.\n"
            "If the answer isn't in the context, say you don't know.\n"
            "Keep the answer concise and practical.\n"
        )
        user = f"QUESTION:\n{q}\n\nCONTEXT:\n{context}"

        answer = await openai_chat(system=system, user=user)

        await log_ai_event(
            db,
            user_id=str(user_id),
            action="copilot",
            ok=True,
            latency_ms=t.ms(),
            meta={"queryChars": len(q), "topK": top_k, "sources": len(chunks)},
        )
        return {"answer": answer, "sources": chunks}

    except HTTPException as e:
        await log_ai_event(
            db,
            user_id=str(user_id),
            action="copilot",
            ok=False,
            latency_ms=t.ms(),
            meta={"queryChars": len(q), "topK": top_k},
            error=str(e.detail),
        )
        raise
    except Exception as e:
        await log_ai_event(
            db,
            user_id=str(user_id),
            action="copilot",
            ok=False,
            latency_ms=t.ms(),
            meta={"queryChars": len(q), "topK": top_k},
            error=str(e),
        )
        raise


@router.post(
    "/notes/{note_id}/summarize",
    response_model=NoteActionResponse,
    dependencies=[Depends(rl_dep("summarize", 30, 60))],
)
async def summarize_note(
    note_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    t = Timer()
    user_id = current_user["_id"]

    try:
        note = await get_note_or_404(db, user_id=user_id, note_id=note_id)
        title = (note.get("title") or "").strip()
        raw_text = note.get("contentText") or ""
        text = clamp_text(raw_text, settings.MAX_NOTE_CHARS)

        system = (
            "You summarize user notes.\n"
            "Return a clean summary with:\n"
            "1) 3-6 bullet key points\n"
            "2) a 1-paragraph short summary\n"
            "Do not invent facts that aren't in the note.\n"
        )
        user = f"TITLE:\n{title}\n\nNOTE:\n{text}\n\nMake it concise."
        result = await openai_chat(system=system, user=user)

        await log_ai_event(
            db,
            user_id=str(user_id),
            action="summarize",
            note_id=note_id,
            ok=True,
            latency_ms=t.ms(),
            meta={"noteChars": len(raw_text), "sentChars": len(text)},
        )
        return {"noteId": note_id, "result": result}

    except HTTPException as e:
        await log_ai_event(
            db,
            user_id=str(user_id),
            action="summarize",
            note_id=note_id,
            ok=False,
            latency_ms=t.ms(),
            error=str(e.detail),
        )
        raise
    except Exception as e:
        await log_ai_event(
            db,
            user_id=str(user_id),
            action="summarize",
            note_id=note_id,
            ok=False,
            latency_ms=t.ms(),
            error=str(e),
        )
        raise


@router.post(
    "/notes/{note_id}/shorten",
    response_model=NoteActionResponse,
    dependencies=[Depends(rl_dep("shorten", 30, 60))],
)
async def shorten_note(
    note_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    t = Timer()
    user_id = current_user["_id"]

    try:
        note = await get_note_or_404(db, user_id=user_id, note_id=note_id)
        title = (note.get("title") or "").strip()
        raw_text = note.get("contentText") or ""
        text = clamp_text(raw_text, settings.MAX_NOTE_CHARS)

        system = (
            "You rewrite notes to be shorter while preserving meaning.\n"
            "Rules:\n"
            "- Keep all important details\n"
            "- Remove repetition\n"
            "- Keep headings if present\n"
            "- Output ONLY the rewritten note text (no extra commentary)\n"
        )
        user = f"TITLE:\n{title}\n\nNOTE:\n{text}\n\nRewrite this note to be ~40-60% shorter."
        result = await openai_chat(system=system, user=user)

        await log_ai_event(
            db,
            user_id=str(user_id),
            action="shorten",
            note_id=note_id,
            ok=True,
            latency_ms=t.ms(),
            meta={"noteChars": len(raw_text), "sentChars": len(text)},
        )
        return {"noteId": note_id, "result": result}

    except HTTPException as e:
        await log_ai_event(
            db,
            user_id=str(user_id),
            action="shorten",
            note_id=note_id,
            ok=False,
            latency_ms=t.ms(),
            error=str(e.detail),
        )
        raise
    except Exception as e:
        await log_ai_event(
            db,
            user_id=str(user_id),
            action="shorten",
            note_id=note_id,
            ok=False,
            latency_ms=t.ms(),
            error=str(e),
        )
        raise


@router.post(
    "/notes/{note_id}/highlights",
    response_model=NoteActionResponse,
    dependencies=[Depends(rl_dep("highlights", 30, 60))],
)
async def highlight_note(
    note_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    t = Timer()
    user_id = current_user["_id"]

    try:
        note = await get_note_or_404(db, user_id=user_id, note_id=note_id)
        title = (note.get("title") or "").strip()
        raw_text = note.get("contentText") or ""
        text = clamp_text(raw_text, settings.MAX_NOTE_CHARS)

        system = (
            "You extract highlights from notes.\n"
            "Return:\n"
            "- Action items (checkbox bullets)\n"
            "- Decisions\n"
            "- Dates/Deadlines (if any)\n"
            "- Key terms\n"
            "If a section is not applicable, write 'None'.\n"
            "Do not invent anything.\n"
        )
        user = f"TITLE:\n{title}\n\nNOTE:\n{text}"
        result = await openai_chat(system=system, user=user)

        await log_ai_event(
            db,
            user_id=str(user_id),
            action="highlights",
            note_id=note_id,
            ok=True,
            latency_ms=t.ms(),
            meta={"noteChars": len(raw_text), "sentChars": len(text)},
        )
        return {"noteId": note_id, "result": result}

    except HTTPException as e:
        await log_ai_event(
            db,
            user_id=str(user_id),
            action="highlights",
            note_id=note_id,
            ok=False,
            latency_ms=t.ms(),
            error=str(e.detail),
        )
        raise
    except Exception as e:
        await log_ai_event(
            db,
            user_id=str(user_id),
            action="highlights",
            note_id=note_id,
            ok=False,
            latency_ms=t.ms(),
            error=str(e),
        )
        raise