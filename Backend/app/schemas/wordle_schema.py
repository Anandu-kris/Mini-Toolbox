from __future__ import annotations

from typing import List, Literal, Optional, Dict,T
from pydantic import BaseModel, Field

Tile = Literal["correct", "present", "absent"]

class WordleDailyResponse(BaseModel):
    dayId: str
    length: int = 5
    maxAttempts: int = 6
    # You can also include "mode": "daily"

class WordleGuessRequest(BaseModel):
    dayId: str
    guess: str = Field(..., min_length=5, max_length=5)

class WordleGuessResponse(BaseModel):
    dayId: str
    guess: str
    evaluation: List[Tile]  # length 5
    attemptsUsed: int
    status: Literal["playing", "won", "lost"]

class WordleStatsResponse(BaseModel):
    played: int = 0
    wins: int = 0
    currentStreak: int = 0
    maxStreak: int = 0
    distribution: Dict[str, int] = Field(default_factory=lambda: {str(i): 0 for i in range(1, 7)})
    lastPlayedDayId: Optional[str] = None

class WordleFinishRequest(BaseModel):
    dayId: str
    status: Literal["won", "lost"]
    attemptsUsed: int = Field(..., ge=1, le=6)