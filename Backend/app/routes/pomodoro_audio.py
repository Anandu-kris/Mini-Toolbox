from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request

from app.deps.auth_deps import get_current_user_email
from app.schemas.pomodoro_audio_schema import (
    PomodoroAudioSettingsIn,
    PomodoroAudioSettingsOut,
    PomodoroAudioSettingsSaveResponse,
)

router = APIRouter(prefix="/api/pomodoro", tags=["Pomodoro Audio"])


def get_db(request: Request):
    db = getattr(request.app.state, "db", None)
    if db is None:
        raise HTTPException(status_code=503, detail="DB not ready")
    return db


@router.get("/audio-settings", response_model=PomodoroAudioSettingsOut)
async def get_audio_settings(
    request: Request,
    user_email: str = Depends(get_current_user_email),
):
    db = get_db(request)

    doc = await db.pomodoro_audio_settings.find_one({"userEmail": user_email})

    if not doc:
        return PomodoroAudioSettingsOut(
            selectedSoundId="rain",
            volume=0.5,
            autoPlayFocus=True,
            pauseOnBreak=True,
            stopOnSessionEnd=True,
            updatedAt=None,
        )

    return PomodoroAudioSettingsOut(
        selectedSoundId=doc.get("selectedSoundId", "rain"),
        volume=doc.get("volume", 0.5),
        autoPlayFocus=doc.get("autoPlayFocus", True),
        pauseOnBreak=doc.get("pauseOnBreak", True),
        stopOnSessionEnd=doc.get("stopOnSessionEnd", True),
        updatedAt=doc.get("updatedAt"),
    )


@router.put("/audio-settings", response_model=PomodoroAudioSettingsSaveResponse)
async def update_audio_settings(
    payload: PomodoroAudioSettingsIn,
    request: Request,
    user_email: str = Depends(get_current_user_email),
):
    db = get_db(request)

    doc = {
        "userEmail": user_email,
        "selectedSoundId": payload.selectedSoundId,
        "volume": payload.volume,
        "autoPlayFocus": payload.autoPlayFocus,
        "pauseOnBreak": payload.pauseOnBreak,
        "stopOnSessionEnd": payload.stopOnSessionEnd,
        "updatedAt": datetime.now(timezone.utc),
    }

    await db.pomodoro_audio_settings.update_one(
        {"userEmail": user_email},
        {"$set": doc},
        upsert=True,
    )

    return PomodoroAudioSettingsSaveResponse(ok=True)