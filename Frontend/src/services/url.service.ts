import { api } from "@/lib/api";

export const REDIRECT_PREFIX = "/r";

export type UrlItem = {
  shortId: string;
  longUrl: string;
  createdAt: string;
  expiresAt?: string;
  clicks: number;
  lastAccessed?: string | null;
  shortUrl?: string;
};

export type ShortenUrlPayload = {
  longUrl: string;
  alias?: string;
};

export type ShortenUrlResponse = {
  shortUrl: string;
};

export const urlService = {
  shorten: async (payload: ShortenUrlPayload): Promise<ShortenUrlResponse> => {
    const res = await api.post("/api/url/shorten", payload);
    return res.data;
  },

  listLinks: async (limit = 100): Promise<UrlItem[]> => {
    const res = await api.get("/api/url/links", { params: { limit } });
    return res.data;
  },

  deleteLink: async (shortId: string): Promise<{ message?: string }> => {
    const res = await api.delete(`/api/url/delete/${shortId}`);
    return res.data;
  },
};
