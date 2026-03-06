import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import {
  wordleService,
  type WordleDaily,
  type WordleGuessPayload,
  type WordleGuessResult,
  type WordleStats,
  type WordleFinishPayload,
} from "@/services/wordle.service";

type ApiErrorBody = {
  detail?: string;
  message?: string;
};

export const wordleKeys = {
  all: ["wordle"] as const,

  daily: () => ["wordle", "daily"] as const,

  stats: () => ["wordle", "stats"] as const,

  game: (dayId: string) => ["wordle", "game", dayId] as const,
};

// Daily (metadata: dayId/len/attempts)
export function useWordleDaily(enabled = true) {
  return useQuery<WordleDaily, AxiosError<ApiErrorBody>>({
    queryKey: wordleKeys.daily(),
    queryFn: () => wordleService.daily(),
    enabled,
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

// Stats
export function useWordleStats(enabled = true) {
  return useQuery<WordleStats, AxiosError<ApiErrorBody>>({
    queryKey: wordleKeys.stats(),
    queryFn: () => wordleService.stats(),
    enabled,
    staleTime: 60_000,
    retry: false,
  });
}

// Submit Guess
export function useWordleGuess() {
  return useMutation<
    WordleGuessResult,
    AxiosError<ApiErrorBody>,
    WordleGuessPayload
  >({
    mutationFn: (payload) => wordleService.guess(payload),
    retry: false,
  });
}

// Finish Game (updates stats)
export function useWordleFinish() {
  const qc = useQueryClient();

  return useMutation<
    WordleStats,
    AxiosError<ApiErrorBody>,
    WordleFinishPayload
  >({
    mutationFn: (payload) => wordleService.finish(payload),
    onSuccess: (stats) => {
      qc.setQueryData(wordleKeys.stats(), stats);

      qc.invalidateQueries({
        queryKey: wordleKeys.daily(),
      });
    },
    retry: false,
  });
}
