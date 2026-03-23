from __future__ import annotations

from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import hashlib
from typing import List, Literal
from app.config import settings

Tile = Literal["correct", "present", "absent"]

WORDLE_TIMEZONE = ZoneInfo(settings.WORDLE_TIMEZONE)

def wordle_day_id(dt: datetime | None = None) -> str:
    if dt is None:
        dt = datetime.now(WORDLE_TIMEZONE)
    else:
        dt = dt.astimezone(WORDLE_TIMEZONE)
    return dt.strftime("%Y-%m-%d")

def evaluate_guess(answer: str, guess: str) -> List[Tile]:
    answer = answer.lower()
    guess = guess.lower()

    res: List[Tile] = ["absent"] * len(answer)
    answer_chars = list(answer)

    for i, ch in enumerate(guess):
        if ch == answer_chars[i]:
            res[i] = "correct"
            answer_chars[i] = None

    for i, ch in enumerate(guess):
        if res[i] == "correct":
            continue
        if ch in answer_chars:
            res[i] = "present"
            answer_chars[answer_chars.index(ch)] = None
        else:
            res[i] = "absent"

    return res

async def get_or_create_daily_answer(db, day_id: str, length: int = 5) -> str:

    cached = await db.wordle_daily.find_one({"_id": day_id})
    if cached and cached.get("answerWord"):
        return cached["answerWord"]

    total = await db.wordle_answers.count_documents({"length": length})
    if total <= 0:
        raise ValueError("No wordle answers seeded")

    digest = hashlib.sha256(day_id.encode("utf-8")).hexdigest()
    idx = int(digest, 16) % total

    doc = await db.wordle_answers.find({"length": length}).sort("word", 1).skip(idx).limit(1).to_list(length=1)
    if not doc:
        raise ValueError("Failed to select daily answer")

    answer = doc[0]["word"]

    await db.wordle_daily.update_one(
        {"_id": day_id},
        {"$set": {"answerWord": answer, "length": length, "updatedAt": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return answer

async def is_allowed_guess(db, guess: str, length: int = 5) -> bool:
    guess = guess.lower().strip()
    return await db.wordle_allowed.count_documents({"word": guess, "length": length}) > 0