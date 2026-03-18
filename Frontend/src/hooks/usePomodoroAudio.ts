import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import {
  pomodoroAudioService,
  type PomodoroAudioSettingsResponse,
  type PomodoroAudioUpdatePayload,
} from "@/services/pomodoro_audio.service";

type ApiErrorBody = {
  detail?: string;
  message?: string;
};

export const pomodoroAudioKeys = {
  all: ["pomodoro-audio"] as const,

  settings: () => ["pomodoro-audio", "settings"] as const,
};

// Get pomodoro audio settings
export function usePomodoroAudioSettings(enabled = true) {
  return useQuery<
    PomodoroAudioSettingsResponse,
    AxiosError<ApiErrorBody>
  >({
    queryKey: pomodoroAudioKeys.settings(),
    queryFn: () => pomodoroAudioService.getSettings(),
    enabled,
    staleTime: 60_000,
  });
}

// Update pomodoro audio settings
export function useUpdatePomodoroAudioSettings() {
  const qc = useQueryClient();

  return useMutation<
    { ok: true },
    AxiosError<ApiErrorBody>,
    PomodoroAudioUpdatePayload
  >({
    mutationFn: pomodoroAudioService.updateSettings,
    onSuccess: (_res, payload) => {
      qc.setQueryData<PomodoroAudioSettingsResponse | undefined>(
        pomodoroAudioKeys.settings(),
        (prev) => {
          if (!prev) {
            return {
              selectedSoundId: payload.selectedSoundId ?? "rain",
              volume: payload.volume ?? 0.5,
              autoPlayFocus: payload.autoPlayFocus ?? true,
              pauseOnBreak: payload.pauseOnBreak ?? true,
              stopOnSessionEnd: payload.stopOnSessionEnd ?? true,
              updatedAt: new Date().toISOString(),
            };
          }

          return {
            ...prev,
            ...(payload.selectedSoundId !== undefined
              ? { selectedSoundId: payload.selectedSoundId ?? prev.selectedSoundId }
              : {}),
            ...(payload.volume !== undefined
              ? { volume: payload.volume ?? prev.volume }
              : {}),
            ...(payload.autoPlayFocus !== undefined
              ? { autoPlayFocus: payload.autoPlayFocus ?? prev.autoPlayFocus }
              : {}),
            ...(payload.pauseOnBreak !== undefined
              ? { pauseOnBreak: payload.pauseOnBreak ?? prev.pauseOnBreak }
              : {}),
            ...(payload.stopOnSessionEnd !== undefined
              ? { stopOnSessionEnd: payload.stopOnSessionEnd ?? prev.stopOnSessionEnd }
              : {}),
            updatedAt: new Date().toISOString(),
          };
        }
      );

      qc.invalidateQueries({ queryKey: pomodoroAudioKeys.all });
    },
  });
}