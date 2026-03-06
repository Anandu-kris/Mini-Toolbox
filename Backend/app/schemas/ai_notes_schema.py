# app/schemas/ai_notes_schema.py
from typing import Optional, List, Any
from pydantic import BaseModel, Field


MAX_QUERY_CHARS = 500
MAX_NOTE_CHARS = 12000
COPILOT_TOP_K = 6
COPILOT_TOP_K_MAX = 10


class NotesCopilotRequest(BaseModel):
    query: str = Field(min_length=1, max_length=MAX_QUERY_CHARS)
    top_k: Optional[int] = Field(default=COPILOT_TOP_K, ge=1, le=COPILOT_TOP_K_MAX)


class NotesCopilotResponse(BaseModel):
    answer: str
    sources: List[Any]


class NoteActionResponse(BaseModel):
    noteId: str
    result: str