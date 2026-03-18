import { api } from "@/lib/api";

export type PomodoroSoundId = string;

export type PomodoroAudioSettings = {
  selectedSoundId: PomodoroSoundId;
  volume: number; // 0 to 1
  autoPlayFocus: boolean;
  pauseOnBreak: boolean;
  stopOnSessionEnd: boolean;
};

export type PomodoroAudioSettingsResponse = PomodoroAudioSettings & {
  updatedAt?: string | null;
};

export type PomodoroAudioUpdatePayload = {
  selectedSoundId?: PomodoroSoundId | null;
  volume?: number | null;
  autoPlayFocus?: boolean | null;
  pauseOnBreak?: boolean | null;
  stopOnSessionEnd?: boolean | null;
};

export const DEFAULT_POMODORO_AUDIO_SETTINGS: PomodoroAudioSettings = {
  selectedSoundId: "rain",
  volume: 0.5,
  autoPlayFocus: true,
  pauseOnBreak: true,
  stopOnSessionEnd: true,
};

function clampVolume(value: number) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export const pomodoroAudioService = {
  // Get current user's pomodoro audio settings
  getSettings: async (): Promise<PomodoroAudioSettingsResponse> => {
    const res = await api.get("/api/pomodoro/audio-settings");
    return res.data;
  },

  // Update current user's pomodoro audio settings
  updateSettings: async (
    payload: PomodoroAudioUpdatePayload
  ): Promise<{ ok: true }> => {
    const normalized: PomodoroAudioUpdatePayload = {
      ...payload,
      selectedSoundId:
        payload.selectedSoundId === ""
          ? null
          : payload.selectedSoundId ?? undefined,
      volume:
        payload.volume == null ? payload.volume : clampVolume(payload.volume),
    };

    const res = await api.put("/api/pomodoro/audio-settings", normalized);
    return res.data;
  },
};