import type { FocusSound } from "@/types/pomodoro_audio.types";

export const FOCUS_SOUNDS: FocusSound[] = [
  {
    id: "rain",
    name: "Rain",
    category: "nature",
    src: "/sounds/rain.mp3",
  },
  {
    id: "forest",
    name: "Forest",
    category: "nature",
    src: "/sounds/forest.mp3",
  },
  {
    id: "white-noise",
    name: "White Noise",
    category: "noise",
    src: "/sounds/white-noise.mp3",
  },
  {
    id: "brown-noise",
    name: "Brown Noise",
    category: "noise",
    src: "/sounds/brown-noise.mp3",
  },
  {
    id: "lofi",
    name: "Lofi",
    category: "music",
    src: "/sounds/lofi.mp3",
  },
];