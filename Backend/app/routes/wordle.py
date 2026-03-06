from __future__ import annotations
from pymongo import ReturnDocument
from datetime import datetime as dt, timedelta,timezone
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, Request

from app.schemas.wordle_schema import (
    WordleDailyResponse,
    WordleGuessRequest,
    WordleGuessResponse,
    WordleStatsResponse,
    WordleFinishRequest,
)
from app.deps.auth_deps import get_current_user_email
from app.services.wordle_service import (
    utc_day_id,
    get_or_create_daily_answer,
    is_allowed_guess,
    evaluate_guess,
)

router = APIRouter(prefix="/api/wordle", tags=["Wordle"])

def get_db(request: Request):
    db = getattr(request.app.state, "db", None)
    if db is None:
        raise HTTPException(status_code=503, detail="DB not ready")
    return db

WORD_LEN = 5
MAX_ATTEMPTS = 6

@router.get("/daily", response_model=WordleDailyResponse)
async def get_daily():
    return WordleDailyResponse(dayId=utc_day_id(), length=WORD_LEN, maxAttempts=MAX_ATTEMPTS)

@router.post("/guess", response_model=WordleGuessResponse)
async def submit_guess(payload: WordleGuessRequest, request: Request, db=Depends(get_db)):
    email = get_current_user_email(request)

    day_id = payload.dayId.strip()
    guess = payload.guess.strip().lower()

    if len(guess) != WORD_LEN or not guess.isalpha():
        raise HTTPException(status_code=400, detail="Guess must be 5 letters")

    if day_id != utc_day_id():
        raise HTTPException(status_code=400, detail="Invalid dayId")

    allowed = await is_allowed_guess(db, guess, length=WORD_LEN)
    if not allowed:
        raise HTTPException(status_code=400, detail="Not in word list")

    game = await db.wordle_games.find_one({"userEmail": email, "dayId": day_id})
    if game and game.get("status") in ("won", "lost"):
        raise HTTPException(status_code=400, detail="Game already finished")

    guesses = (game or {}).get("guesses", [])
    if len(guesses) >= MAX_ATTEMPTS:
        raise HTTPException(status_code=400, detail="No attempts left")

    if guess in guesses:
        raise HTTPException(status_code=400, detail="Already guessed")

    answer = await get_or_create_daily_answer(db, day_id, length=WORD_LEN)

    evaluation = evaluate_guess(answer, guess)

    guesses.append(guess)
    attempts_used = len(guesses)

    status = "playing"
    if guess == answer:
        status = "won"
    elif attempts_used >= MAX_ATTEMPTS:
        status = "lost"

    now = dt.now(timezone.utc)

    await db.wordle_games.update_one(
        {"userEmail": email, "dayId": day_id},
        {
            "$set": {"status": status, "attempts": attempts_used, "updatedAt": now},
            "$setOnInsert": {"createdAt": now},
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

@router.get("/stats", response_model=WordleStatsResponse)
async def get_stats(request: Request, db=Depends(get_db)):
    email = get_current_user_email(request)
    doc = await db.wordle_stats.find_one({"userEmail": email})
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

@router.post("/finish", response_model=WordleStatsResponse)
async def finish_game(payload: WordleFinishRequest, request: Request, db=Depends(get_db)):

    email = get_current_user_email(request)
    day_id = payload.dayId.strip()

    if day_id != utc_day_id():
        raise HTTPException(status_code=400, detail="Invalid dayId")

    game = await db.wordle_games.find_one({"userEmail": email, "dayId": day_id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    if game.get("status") != payload.status:
        raise HTTPException(status_code=400, detail="Status mismatch")
    
    now = dt.now(timezone.utc)

    claimed = await db.wordle_games.find_one_and_update(
        {"userEmail": email, "dayId": day_id, "countedStats": {"$ne": True}},
        {"$set": {"countedStats": True, "updatedAt": now}},
        return_document=ReturnDocument.AFTER,
    )

    if not claimed:
        return await get_stats(request, db)


    stats = await db.wordle_stats.find_one({"userEmail": email}) or {}
    played = int(stats.get("played", 0))
    wins = int(stats.get("wins", 0))
    current = int(stats.get("currentStreak", 0))
    maxs = int(stats.get("maxStreak", 0))
    dist = stats.get("distribution") or {str(i): 0 for i in range(1, 7)}
    last_day = stats.get("lastPlayedDayId")

    def parse_day(s: str) -> dt:
        return dt.strptime(s, "%Y-%m-%d")

    if payload.status == "won":
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

    played += 1
    maxs = max(maxs, current)

    await db.wordle_stats.update_one(
        {"userEmail": email},
        {
            "$set": {
                "played": played,
                "wins": wins,
                "currentStreak": current,
                "maxStreak": maxs,
                "distribution": dist,
                "lastPlayedDayId": day_id,
                "updatedAt": now,
            }
        },
        upsert=True,
    )

    await db.wordle_games.update_one(
        {"userEmail": email, "dayId": day_id},
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