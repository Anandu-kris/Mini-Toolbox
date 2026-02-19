import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import {
  urlService,
  type UrlItem,
  type ShortenUrlPayload,
  type ShortenUrlResponse,
} from "@/services/url.service";

type ApiErrorBody = {
  detail?: string;
  message?: string;
};

export const urlKeys = {
  all: ["url"] as const,
  links: (limit: number) => ["url", "links", limit] as const,
};

//Shorten URL
export function useShortenUrl() {
  const qc = useQueryClient();

  return useMutation<
    ShortenUrlResponse,
    AxiosError<ApiErrorBody>,
    ShortenUrlPayload
  >({
    mutationFn: urlService.shorten,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: urlKeys.all });
    },
  });
}

//Get Shortened all links
export function useUrlLinks(limit = 100, enabled = true) {
  return useQuery<UrlItem[], AxiosError<ApiErrorBody>>({
    queryKey: urlKeys.links(limit),
    queryFn: () => urlService.listLinks(limit),
    enabled,
    staleTime: 60_000,
  });
}

//Delete a Shortened link
export function useDeleteUrlLink(limit = 100) {
  const qc = useQueryClient();

  return useMutation<{ message?: string }, AxiosError<ApiErrorBody>, string>({
    mutationFn: (shortId: string) => urlService.deleteLink(shortId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: urlKeys.links(limit) });
    },
  });
}
