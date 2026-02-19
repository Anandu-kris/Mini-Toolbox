import { useMemo, useState } from "react";
import { useDebounceValue } from "@/hooks/useDebounceValue";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Link as LinkIcon,
  RefreshCw,
  Trash2,
  Copy,
  ExternalLink,
} from "lucide-react";

import { api } from "@/lib/api";
import { REDIRECT_PREFIX,type UrlItem } from "@/services/url.service";
import { useUrlLinks, useDeleteUrlLink } from "@/hooks/useUrlShortner";

function buildShortUrl(apiBase: string, shortId: string) {
  const origin = new URL(apiBase).origin;
  return `${origin}${REDIRECT_PREFIX}/${shortId}`;
}

export default function LinksDrawer() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  const debouncedInput = useDebounceValue(input, 800);

  // Pull baseURL from axios instance (single source of truth)
  const API_BASE = (api.defaults.baseURL ?? "") as string;

  // Load only when drawer is open
  const {
    data: links = [],
    isFetching,
    error,
    refetch,
  } = useUrlLinks(100, open);

  const { mutateAsync: deleteLink, isPending: deleting } = useDeleteUrlLink(100);

  const filtered = useMemo(() => {
    if (!debouncedInput) return links;
    const lower = debouncedInput.toLowerCase();
    return links.filter(
      (u) =>
        u.longUrl.toLowerCase().includes(lower) ||
        u.shortId.toLowerCase().includes(lower)
    );
  }, [links, debouncedInput]);

  async function copyShort(u: UrlItem) {
    await navigator.clipboard.writeText(buildShortUrl(API_BASE, u.shortId));
  }

  function openShort(u: UrlItem) {
    window.open(buildShortUrl(API_BASE, u.shortId), "_blank");
  }

  async function remove(u: UrlItem) {
    if (!confirm(`Delete ${u.shortId}?`)) return;
    try {
      await deleteLink(u.shortId);
    } catch (e: unknown) {
      const error = e as { response?: { data?: { detail?: string } }; message?: string };
      alert(error?.response?.data?.detail || error?.message || "Delete failed");
    }
  }

  const errMsg =
    error instanceof Error ? error.message : error ? "Failed to load links" : "";

  const now = Date.now();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="fixed top-6 right-6 z-50 mt-20">
        <SheetTrigger asChild>
          <Button variant="secondary" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            All Links
          </Button>
        </SheetTrigger>
      </div>

      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl md:max-w-3xl overflow-y-auto bg-white"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between mt-10">
            <span>All Short Links</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh"
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 ml-3 w-full max-w-lg flex items-center gap-2">
          <Input
            placeholder="Search by long URL or short id…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        <Separator className="my-4" />

        {errMsg && <div className="text-red-600 text-sm mb-2">{errMsg}</div>}

        <Table>
          <TableCaption>
            {isFetching
              ? "Loading…"
              : filtered.length
              ? `${filtered.length} item(s)`
              : "No links found."}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Short</TableHead>
              <TableHead>Short URL</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.map((u) => {
              const expired = u.expiresAt
                ? new Date(u.expiresAt).getTime() <= now
                : false;

              const shortUrl = u.shortUrl ?? buildShortUrl(API_BASE, u.shortId);

              return (
                <TableRow
                  key={u.shortId}
                  className={expired ? "opacity-80" : ""}
                >
                  <TableCell className="font-mono">{u.shortId}</TableCell>

                  <TableCell className="max-w-[320px] truncate">
                    <p
                      className="underline underline-offset-4 hover:text-blue-500"
                      title={shortUrl}
                    >
                      {shortUrl}
                    </p>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2 transition-all hover:scale-105"
                        onClick={() => copyShort(u)}
                        title="Copy short URL"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>

                      <Button
                        size="sm"
                        className="flex items-center gap-2 transition-all hover:scale-105"
                        onClick={() => openShort(u)}
                        disabled={expired}
                        title="Open short URL"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex items-center gap-2"
                        onClick={() => remove(u)}
                        disabled={deleting}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </SheetContent>
    </Sheet>
  );
}
