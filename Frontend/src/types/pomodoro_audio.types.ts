export type FocusSoundCategory = "nature" | "noise" | "music";

export type FocusSound = {
  id: string;
  name: string;
  category: FocusSoundCategory;
  src: string;
};

export type PomodoroAudioSettings = {
  selectedSoundId: string;
  volume: number; // 0 to 1
  autoPlayFocus: boolean;
  pauseOnBreak: boolean;
  stopOnSessionEnd: boolean;
};

export type PomodoroAudioSettingsResponse = PomodoroAudioSettings & {
  updatedAt?: string | null;
};

export type PomodoroMode = "focus" | "short" | "long";