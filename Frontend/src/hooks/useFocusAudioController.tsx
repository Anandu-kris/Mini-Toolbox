import { useEffect, useMemo, useRef, useState } from "react";

import { FOCUS_SOUNDS } from "@/data/focusSounds";
import {
  DEFAULT_POMODORO_AUDIO_SETTINGS,
  type PomodoroAudioSettings,
} from "@/services/pomodoro_audio.service";
import {
  usePomodoroAudioSettings,
  useUpdatePomodoroAudioSettings,
} from "@/hooks/usePomodoroAudio";

export type PomodoroMode = "focus" | "short" | "long";

type UseFocusAudioControllerParams = {
  mode: PomodoroMode;
  isRunning: boolean;
};

function clampVolume(value: number) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function useFocusAudioController({
  mode,
  isRunning,
}: UseFocusAudioControllerParams) {
  const { data, isLoading } = usePomodoroAudioSettings(true);
  const updateSettingsMutation = useUpdatePomodoroAudioSettings();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const hasHydratedRef = useRef(false);

  const [settings, setSettings] = useState<PomodoroAudioSettings>(
    DEFAULT_POMODORO_AUDIO_SETTINGS,
  );
  const [isPlaying, setIsPlaying] = useState(false);

  const selectedSound = useMemo(
    () =>
      FOCUS_SOUNDS.find((sound) => sound.id === settings.selectedSoundId) ??
      FOCUS_SOUNDS[0],
    [settings.selectedSoundId],
  );

  const persistSettings = (next: PomodoroAudioSettings) => {
    setSettings(next);

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      updateSettingsMutation.mutate({
        selectedSoundId: next.selectedSoundId,
        volume: next.volume,
        autoPlayFocus: next.autoPlayFocus,
        pauseOnBreak: next.pauseOnBreak,
        stopOnSessionEnd: next.stopOnSessionEnd,
      });
    }, 350);
  };

  useEffect(() => {
    const next: PomodoroAudioSettings = {
      selectedSoundId:
        data?.selectedSoundId ??
        DEFAULT_POMODORO_AUDIO_SETTINGS.selectedSoundId,
      volume: clampVolume(
        data?.volume ?? DEFAULT_POMODORO_AUDIO_SETTINGS.volume,
      ),
      autoPlayFocus:
        data?.autoPlayFocus ?? DEFAULT_POMODORO_AUDIO_SETTINGS.autoPlayFocus,
      pauseOnBreak:
        data?.pauseOnBreak ?? DEFAULT_POMODORO_AUDIO_SETTINGS.pauseOnBreak,
      stopOnSessionEnd:
        data?.stopOnSessionEnd ??
        DEFAULT_POMODORO_AUDIO_SETTINGS.stopOnSessionEnd,
    };

    setSettings(next);
    hasHydratedRef.current = true;
  }, [data]);

  useEffect(() => {
    if (!selectedSound?.src) return;

    const wasPlaying = !!audioRef.current && !audioRef.current.paused;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    const audio = new Audio(selectedSound.src);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = settings.volume;

    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => setIsPlaying(false);

    audioRef.current = audio;

    if (wasPlaying) {
      audio.play().catch(() => {
        setIsPlaying(false);
      });
    }

    return () => {
      audio.pause();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSound?.src]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = settings.volume;
  }, [settings.volume]);

  useEffect(() => {
    if (!hasHydratedRef.current || !audioRef.current) return;

    if (mode === "focus") {
      if (isRunning && settings.autoPlayFocus) {
        audioRef.current.play().catch(() => {
          setIsPlaying(false);
        });
      } else if (!isRunning && settings.stopOnSessionEnd) {
        audioRef.current.pause();
      }
      return;
    }

    if ((mode === "short" || mode === "long") && settings.pauseOnBreak) {
      audioRef.current.pause();
    }
  }, [
    mode,
    isRunning,
    settings.autoPlayFocus,
    settings.pauseOnBreak,
    settings.stopOnSessionEnd,
  ]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      return;
    }

    try {
      await audioRef.current.play();
    } catch {
      setIsPlaying(false);
    }
  };

  const pause = () => {
    audioRef.current?.pause();
  };

  const play = async () => {
    if (!audioRef.current) return;

    try {
      await audioRef.current.play();
    } catch {
      setIsPlaying(false);
    }
  };

  const selectSound = (soundId: string) => {
    persistSettings({
      ...settings,
      selectedSoundId: soundId,
    });
  };

  const changeVolume = (value: number[] | number) => {
    const raw = Array.isArray(value) ? (value[0] ?? 0.5) : value;
    const nextVolume = clampVolume(raw);

    if (audioRef.current) {
      audioRef.current.volume = nextVolume;
    }

    persistSettings({
      ...settings,
      volume: nextVolume,
    });
  };

  const setAutoPlayFocus = (checked: boolean) => {
    persistSettings({
      ...settings,
      autoPlayFocus: checked,
    });
  };

  const setPauseOnBreak = (checked: boolean) => {
    persistSettings({
      ...settings,
      pauseOnBreak: checked,
    });
  };

  const setStopOnSessionEnd = (checked: boolean) => {
    persistSettings({
      ...settings,
      stopOnSessionEnd: checked,
    });
  };

  return {
    settings,
    setSettings,
    selectedSound,
    isPlaying,
    isLoading,
    isSaving: updateSettingsMutation.isPending,

    audioRef,

    play,
    pause,
    togglePlay,
    selectSound,
    changeVolume,
    setAutoPlayFocus,
    setPauseOnBreak,
    setStopOnSessionEnd,
  };
}
