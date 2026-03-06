import { api } from "@/lib/api";

export type Tile = "correct" | "present" | "absent";

export type WordleDayId = string;

export type WordleDaily = {
  dayId: WordleDayId;
  length: number; // usually 5
  maxAttempts: number; // usually 6
};

export type WordleGuessPayload = {
  dayId: WordleDayId;
  guess: string; // 5 letters
};

export type WordleGuessResult = {
  dayId: WordleDayId;
  guess: string;
  evaluation: Tile[]; // length 5
  attemptsUsed: number;
  status: "playing" | "won" | "lost";
};

export type WordleStats = {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  distribution: Record<string, number>; // keys "1".."6"
  lastPlayedDayId?: string | null;
};

export type WordleFinishPayload = {
  dayId: WordleDayId;
  status: "won" | "lost";
  attemptsUsed: number; // 1..6
};

export const wordleService = {
  // Get today's Wordle metadata (does NOT return answer)
  daily: async (): Promise<WordleDaily> => {
    const res = await api.get("/api/wordle/daily", {
      // helps avoid dev caching weirdness
      headers: { "Cache-Control": "no-cache" },
    });
    return res.data;
  },

  // Submit a guess (server validates + evaluates)
  guess: async (payload: WordleGuessPayload): Promise<WordleGuessResult> => {
    const res = await api.post("/api/wordle/guess", payload);
    return res.data;
  },

  // Fetch user stats (streak, distribution)
  stats: async (): Promise<WordleStats> => {
    const res = await api.get("/api/wordle/stats");
    return res.data;
  },

  // Mark game as finished (updates stats; safe against double count on backend)
  finish: async (payload: WordleFinishPayload): Promise<WordleStats> => {
    const res = await api.post("/api/wordle/finish", payload);
    return res.data;
  },
};