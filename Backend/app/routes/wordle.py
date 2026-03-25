from __future__ import annotations

from pymongo import ReturnDocument
from datetime import datetime as dt, timedelta, timezone
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, Request

from app.schemas.wordle_schema import (
    WordleDailyResponse,
    WordleGuessRequest,
    WordleGuessResponse,
    WordleStatsResponse,
    WordleFinishRequest,
)
from app.deps.auth_deps import get_current_user
from app.services.wordle_service import (
    wordle_day_id,
    get_or_create_daily_answer,
    is_allowed_guess,
    evaluate_guess,
)
from app.config import settings
from app.services.notifications_service import create_notification

router = APIRouter(prefix="/api/wordle", tags=["Wordle"])

def get_db(request: Request):
    db = getattr(request.app.state, "db", None)
    if db is None:
        raise HTTPException(status_code=503, detail="DB not ready")
    return db


async def emit_new_wordle_notification_if_needed(
    *,
    db,
    user_id: str,
    day_id: str,
) -> None:
    """
    Emit a 'new Wordle game is ready' notification once per user per day.

    Since you are not storing notifications in a notifications table,
    we store only a tiny delivery marker in MongoDB so the same event
    is not emitted repeatedly for the same user/day.
    """
    already_sent = await db.notification_delivery_markers.find_one(
        {
            "userId": user_id,
            "dayId": day_id,
            "type": "wordle.daily_ready",
        }
    )

    if already_sent:
        return

    now = dt.now(timezone.utc)

    await create_notification(
        db=db,
        user_id=str(user_id),
        type="wordle.daily_ready",
        title="New Wordle game is ready",
        message="Today's Wordle has reset. A new word is now available to play.",
        severity="info",
        read=False,
        meta={
            "source": "wordle",
            "kind": "wordle.daily_ready",
            "dayId": day_id,
        },
        emit_realtime=True,
    )

    await db.notification_delivery_markers.insert_one(
        {
            "userId": user_id,
            "dayId": day_id,
            "type": "wordle.daily_ready",
            "createdAt": now,
        }
    )
    
# Daily Game
@router.get("/daily", response_model=WordleDailyResponse)
async def get_daily(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = current_user["_id"]
    day_id = wordle_day_id()

    await get_or_create_daily_answer(
        db,
        day_id,
        length=settings.WORDLE_WORD_LENGTH,
    )

    await emit_new_wordle_notification_if_needed(
        db=db,
        user_id=user_id,
        day_id=day_id,
    )

    return WordleDailyResponse(
        dayId=day_id,
        length=settings.WORDLE_WORD_LENGTH,
        maxAttempts=settings.WORDLE_MAX_ATTEMPTS,
    )

# Guess Call
@router.post("/guess", response_model=WordleGuessResponse)
async def submit_guess(
    payload: WordleGuessRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = current_user["_id"]
    user_email = current_user.get("userEmail") or current_user.get("email")

    day_id = payload.dayId.strip()
    guess = payload.guess.strip().lower()

    if len(guess) != settings.WORDLE_WORD_LENGTH or not guess.isalpha():
        raise HTTPException(status_code=400, detail="Guess must be 5 letters")

    if day_id != wordle_day_id():
        raise HTTPException(status_code=400, detail="Invalid dayId")

    allowed = await is_allowed_guess(db, guess, length=settings.WORDLE_WORD_LENGTH)
    if not allowed:
        raise HTTPException(status_code=400, detail="Not in word list")

    game = await db.wordle_games.find_one({"userId": user_id, "dayId": day_id})
    if game and game.get("status") in ("won", "lost"):
        raise HTTPException(status_code=400, detail="Game already finished")

    guesses = (game or {}).get("guesses", [])
    if len(guesses) >= settings.WORDLE_MAX_ATTEMPTS:
        raise HTTPException(status_code=400, detail="No attempts left")

    if guess in guesses:
        raise HTTPException(status_code=400, detail="Already guessed")

    answer = await get_or_create_daily_answer(db, day_id, length=settings.WORDLE_WORD_LENGTH)
    evaluation = evaluate_guess(answer, guess)

    guesses.append(guess)
    attempts_used = len(guesses)

    status = "playing"
    if guess == answer:
        status = "won"
    elif attempts_used >= settings.WORDLE_MAX_ATTEMPTS:
        status = "lost"

    now = dt.now(timezone.utc)

    await db.wordle_games.update_one(
        {"userId": user_id, "dayId": day_id},
        {
            "$set": {
                "userId": user_id,
                "status": status,
                "attempts": attempts_used,
                "updatedAt": now,
            },
            "$setOnInsert": {
                "createdAt": now,
                "countedStats": False,
            },
            "$push": {"guesses": guess},
        },
        upsert=True,
    )

    return WordleGuessResponse(
        dayId=day_id,
        guess=guess,
        evaluation=evaluation,
        attemptsUsed=attempts_used,
        status=status,
    )

# Game Stats
@router.get("/stats", response_model=WordleStatsResponse)
async def get_stats(
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = current_user["_id"]

    doc = await db.wordle_stats.find_one({"userId": user_id})
    if not doc:
        return WordleStatsResponse()

    dist: Dict[str, int] = {str(i): 0 for i in range(1, 7)}
    dist.update(doc.get("distribution") or {})

    return WordleStatsResponse(
        played=doc.get("played", 0),
        wins=doc.get("wins", 0),
        currentStreak=doc.get("currentStreak", 0),
        maxStreak=doc.get("maxStreak", 0),
        distribution=dist,
        lastPlayedDayId=doc.get("lastPlayedDayId"),
    )

# Game End
@router.post("/finish", response_model=WordleStatsResponse)
async def finish_game(
    payload: WordleFinishRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = current_user["_id"]
    user_email = current_user.get("userEmail") or current_user.get("email")
    day_id = payload.dayId.strip()

    if day_id != wordle_day_id():
        raise HTTPException(status_code=400, detail="Invalid dayId")

    game = await db.wordle_games.find_one({"userId": user_id, "dayId": day_id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    if game.get("status") != payload.status:
        raise HTTPException(status_code=400, detail="Status mismatch")

    now = dt.now(timezone.utc)

    claimed = await db.wordle_games.find_one_and_update(
        {"userId": user_id, "dayId": day_id, "countedStats": {"$ne": True}},
        {"$set": {"countedStats": True, "updatedAt": now}},
        return_document=ReturnDocument.AFTER,
    )

    if not claimed:
        return await get_stats(current_user=current_user, db=db)

    stats = await db.wordle_stats.find_one({"userId": user_id}) or {}
    played = int(stats.get("played", 0))
    wins = int(stats.get("wins", 0))
    current = int(stats.get("currentStreak", 0))
    maxs = int(stats.get("maxStreak", 0))
    dist = stats.get("distribution") or {str(i): 0 for i in range(1, 7)}
    last_day = stats.get("lastPlayedDayId")

    def parse_day(s: str) -> dt:
        return dt.strptime(s, "%Y-%m-%d")

    if payload.status == "won":
        await create_notification(
            db=db,
            user_id=str(user_id),
            type="wordle.win",
            title="Wordle won",
            message=f"You solved today's Wordle in {payload.attemptsUsed} attempts.",
            severity="success",
            read=False,
            meta={
                "source": "wordle",
                "kind": "wordle.win",
                "dayId": day_id,
                "attemptsUsed": payload.attemptsUsed,
            },
        )
        if payload.attemptsUsed < 1 or payload.attemptsUsed > 6:
            raise HTTPException(status_code=400, detail="Invalid attemptsUsed")

        if last_day:
            try:
                y = parse_day(day_id) - timedelta(days=1)
                if parse_day(last_day) == y:
                    current += 1
                elif last_day != day_id:
                    current = 1
            except Exception:
                current = 1
        else:
            current = 1

        wins += 1
        dist[str(payload.attemptsUsed)] = int(dist.get(str(payload.attemptsUsed), 0)) + 1
    else:
        current = 0
        if payload.status == "lost":
            await create_notification(
                db=db,
                user_id=str(user_id),
                type="wordle.lost",
                title="Wordle finished",
                message="Today's Wordle game has ended. Try again tomorrow.",
                severity="warning",
                read=False,
                meta={
                    "source": "wordle",
                    "kind": "wordle.lost",
                    "dayId": day_id,
                },
            )

    played += 1
    maxs = max(maxs, current)

    await db.wordle_stats.update_one(
        {"userId": user_id},
        {
            "$set": {
                "userId": user_id,
                "played": played,
                "wins": wins,
                "currentStreak": current,
                "maxStreak": maxs,
                "distribution": dist,
                "lastPlayedDayId": day_id,
                "updatedAt": now,
            },
            "$setOnInsert": {
                "createdAt": now,
            },
        },
        upsert=True,
    )

    await db.wordle_games.update_one(
        {"userId": user_id, "dayId": day_id},
        {"$set": {"countedStats": True, "updatedAt": now}},
    )

    return WordleStatsResponse(
        played=played,
        wins=wins,
        currentStreak=current,
        maxStreak=maxs,
        distribution=dist,
        lastPlayedDayId=day_id,
    )