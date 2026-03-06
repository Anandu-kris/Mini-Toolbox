import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import {
  aiNotesService,
  type NotesCopilotPayload,
  type NotesCopilotResponse,
  type NoteActionResponse,
} from "@/services/ai_notes.service";

type ApiErrorBody = {
  detail?: string;
  message?: string;
};

export const aiNotesKeys = {
  copilot: ["ai", "copilot"] as const,
  noteAction: (noteId: string, action: string) =>
    ["ai", "note", noteId, action] as const,
};

/* ---------------------------------- */
/* 🔎 Ask Notes Copilot */
/* ---------------------------------- */
export function useNotesCopilot() {
  return useMutation<
    NotesCopilotResponse,
    AxiosError<ApiErrorBody>,
    NotesCopilotPayload
  >({
    mutationFn: aiNotesService.copilot,
  });
}

/* ---------------------------------- */
/* 📝 Summarize Note */
/* ---------------------------------- */
export function useSummarizeNote() {
  return useMutation<
    NoteActionResponse,
    AxiosError<ApiErrorBody>,
    string
  >({
    mutationFn: (noteId) => aiNotesService.summarize(noteId),
  });
}

/* ---------------------------------- */
/* ✂️ Shorten Note */
/* ---------------------------------- */
export function useShortenNote() {
  return useMutation<
    NoteActionResponse,
    AxiosError<ApiErrorBody>,
    string
  >({
    mutationFn: (noteId) => aiNotesService.shorten(noteId),
  });
}

/* ---------------------------------- */
/* ✨ Highlights */
/* ---------------------------------- */
export function useHighlightsNote() {
  return useMutation<
    NoteActionResponse,
    AxiosError<ApiErrorBody>,
    string
  >({
    mutationFn: (noteId) => aiNotesService.highlights(noteId),
  });
}