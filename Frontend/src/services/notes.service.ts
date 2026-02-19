import { api } from "@/lib/api";

export type NoteId = string;

export type NoteItem = {
  id: NoteId;
  title: string;
  contentHtml: string;
  contentText: string;
  tags: string[];
  pinned: boolean;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NoteCreatePayload = {
  title: string;
  contentHtml?: string;
  tags?: string[];
  pinned?: boolean;
};

export type NoteUpdatePayload = {
  title?: string | null;
  contentHtml?: string | null;
  tags?: string[] | null;
  pinned?: boolean | null;
  isTrashed?: boolean | null;
};

export type NotesListParams = {
  limit?: number;
  skip?: number;
  q?: string;
  pinned?: boolean;
  tag?: string;
  trashed?: boolean;
};

export const notesService = {
  // Create Note
  create: async (payload: NoteCreatePayload): Promise<NoteItem> => {
    const res = await api.post("/api/notes/create", payload);
    return res.data;
  },

  // List Notes
  list: async (params: NotesListParams = {}): Promise<NoteItem[]> => {
    const res = await api.get("/api/notes", { params });
    return res.data;
  },

  // Get single Note
  getById: async (noteId: NoteId): Promise<NoteItem> => {
    const res = await api.get(`/api/notes/${noteId}`);
    return res.data;
  },

  // Update Note
  update: async (
    noteId: NoteId,
    payload: NoteUpdatePayload,
  ): Promise<NoteItem> => {
    const res = await api.patch(`/api/notes/${noteId}`, payload);
    return res.data;
  },

  // Delete Note (hard delete)
  remove: async (noteId: NoteId): Promise<{ ok: true }> => {
    const res = await api.delete(`/api/notes/${noteId}`);
    return res.data;
  },
};
