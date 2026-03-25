from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class RealtimeEvent(BaseModel):
    id: str = Field(default_factory=lambda: f"evt_{uuid4().hex}")
    type: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    userId: str
    module: str
    payload: Dict[str, Any]
    meta: Optional[Dict[str, Any]] = None