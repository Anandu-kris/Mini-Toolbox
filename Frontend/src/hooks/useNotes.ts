import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import {
  notesService,
  type NoteItem,
  type NoteCreatePayload,
  type NoteUpdatePayload,
  type NotesListParams,
  type NoteId,
} from "@/services/notes.service";

type ApiErrorBody = {
  detail?: string;
  message?: string;
};

export const notesKeys = {
  all: ["notes"] as const,

  list: (params: NotesListParams) => ["notes", "list", params] as const,

  byId: (id: NoteId) => ["notes", "byId", id] as const,
};



// List notes
export function useNotesList(params: NotesListParams = {}, enabled = true) {
  return useQuery<NoteItem[], AxiosError<ApiErrorBody>>({
    queryKey: notesKeys.list(params),
    queryFn: () => notesService.list(params),
    enabled,
    staleTime: 60_000,
  });
}

// Get a note by id
export function useNote(noteId: NoteId, enabled = true) {
  return useQuery<NoteItem, AxiosError<ApiErrorBody>>({
    queryKey: notesKeys.byId(noteId),
    queryFn: () => notesService.getById(noteId),
    enabled: enabled && !!noteId,
    staleTime: 60_000,
  });
}


// Create note
export function useCreateNote() {
  const qc = useQueryClient();

  return useMutation<NoteItem, AxiosError<ApiErrorBody>, NoteCreatePayload>({
    mutationFn: notesService.create,
    onSuccess: () => {
      // refresh all notes lists
      qc.invalidateQueries({ queryKey: notesKeys.all });
      // OR if you want only current list:
      // qc.invalidateQueries({ queryKey: notesKeys.list(listParams) });
    },
  });
}

// Update note
export function useUpdateNote() {
  const qc = useQueryClient();

  return useMutation<
    NoteItem,
    AxiosError<ApiErrorBody>,
    { noteId: NoteId; payload: NoteUpdatePayload }
  >({
    mutationFn: ({ noteId, payload }) => notesService.update(noteId, payload),
    onSuccess: (updated) => {
      // update single cache
      qc.setQueryData(notesKeys.byId(updated.id), updated);

      // refresh lists (so title/tags/pinned order updates)
      qc.invalidateQueries({ queryKey: notesKeys.all });
      // or only the active list:
      // qc.invalidateQueries({ queryKey: notesKeys.list(listParams) });
    },
  });
}

// Delete note
export function useDeleteNote() {
  const qc = useQueryClient();

  return useMutation<{ ok: true }, AxiosError<ApiErrorBody>, NoteId>({
    mutationFn: (noteId) => notesService.remove(noteId),
    onSuccess: (_res, noteId) => {
      // remove single cache
      qc.removeQueries({ queryKey: notesKeys.byId(noteId) });

      // refresh lists
      qc.invalidateQueries({ queryKey: notesKeys.all });
      // or only active list:
      // qc.invalidateQueries({ queryKey: notesKeys.list(listParams) });
    },
  });
}
