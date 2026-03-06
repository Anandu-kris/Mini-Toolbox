import { api } from "@/lib/api";

export type CopilotSource = {
  noteId: string;
  title?: string;
  chunkIndex?: number;
  snippet?: string;
};

export type NotesCopilotPayload = {
  query: string;
  top_k?: number;
};

export type NotesCopilotResponse = {
  answer: string;
  sources: CopilotSource[];
};

export type NoteActionResponse = {
  noteId: string;
  result: string;
};

export const aiNotesService = {
  // 🔎 Ask across notes (RAG)
  copilot: async (
    payload: NotesCopilotPayload,
  ): Promise<NotesCopilotResponse> => {
    const res = await api.post("/api/ai/notes", payload);
    return res.data;
  },

  // 📝 Summarize note
  summarize: async (noteId: string): Promise<NoteActionResponse> => {
    const res = await api.post(`/api/ai/notes/${noteId}/summarize`);
    return res.data;
  },

  // ✂️ Shorten note
  shorten: async (noteId: string): Promise<NoteActionResponse> => {
    const res = await api.post(`/api/ai/notes/${noteId}/shorten`);
    return res.data;
  },

  // ✨ Extract highlights
  highlights: async (noteId: string): Promise<NoteActionResponse> => {
    const res = await api.post(`/api/ai/notes/${noteId}/highlights`);
    return res.data;
  },
};