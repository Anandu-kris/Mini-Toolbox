from datetime import datetime
from pydantic import BaseModel, Field

class PomodoroAudioSettingsIn(BaseModel):
    selectedSoundId: str | None = Field(default=None)
    volume: float | None = Field(default=None, ge=0.0, le=1.0)
    autoPlayFocus: bool | None = None
    pauseOnBreak: bool | None = None
    stopOnSessionEnd: bool | None = None

class PomodoroAudioSettingsOut(PomodoroAudioSettingsIn):
    updatedAt: datetime | None = None

class PomodoroAudioSettingsSaveResponse(BaseModel):
    ok: bool = True