import { Search, Plus, PencilLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { NoteItem } from "@/services/notes.service";

type NotesListPanelProps = {
  q: string;
  onQChange: (v: string) => void;

  trashed: boolean;
  isNotesOrTrash: boolean;

  notes: NoteItem[];
  selectedId: string;
  onSelect: (id: string) => void;

  isLoading: boolean;
  isError: boolean;
  error: unknown;

  onCreate: () => void;
  createPending?: boolean;
};

export function NotesListPanel({
  q,
  onQChange,
  trashed,
  isNotesOrTrash,
  notes,
  selectedId,
  onSelect,
  isLoading,
  isError,
  error,
  onCreate,
  createPending = false,
}: NotesListPanelProps) {
  const errMsg =
    (error as { response?: { data?: { detail?: string } } })?.response?.data
      ?.detail ??
    (error as { message?: string })?.message ??
    "Failed to load notes";

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 h-full min-h-0 flex flex-col">
      {/* Search + Create */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            placeholder={trashed ? "Search trash..." : "Search notes..."}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            disabled={!isNotesOrTrash}
          />
        </div>

        <Button
          onClick={onCreate}
          className="gap-2 hover:bg-gray-800 cursor-pointer"
          disabled={!isNotesOrTrash || trashed || createPending}
          title={trashed ? "Create notes from Notes tab" : "Create note"}
        >
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      {/* Notes Area */}
      <div className="mt-4 flex-1 min-h-0 overflow-y-auto pr-1">
        {!isNotesOrTrash ? (
          <div className="text-sm text-white/60 px-1 py-6">
            Select “Notes” or “Trash” to view items.
          </div>
        ) : isLoading ? (
          <div className="text-sm text-white/60 px-1 py-6">Loading…</div>
        ) : isError ? (
          <div className="text-sm text-red-300 px-1 py-6">{errMsg}</div>
        ) : notes.length === 0 ? (
          <div className="text-sm text-white/60 px-1 py-6">No notes found.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {notes.map((n) => (
              <div
                className={cn(
                  "h-[140px] flex flex-col justify-between text-left rounded-2xl border p-4 transition",
                  "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20",
                  "shadow-sm",
                  selectedId === n.id && "bg-white/12 border-white/25",
                )}
              >
                {/* Title + Date */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-white font-semibold truncate">
                      {n.title}
                    </div>
                    <div className="mt-4 text-xs text-white/60 line-clamp-1 ">
                      {n.contentText || "—"}
                    </div>
                  </div>

                  <div className="text-xs text-white/50 whitespace-nowrap">
                    {new Date(n.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {n.tags?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {n.tags.slice(0, 3).map((t) => (
                          <Badge
                            key={t}
                            variant="secondary"
                            className="bg-white/10 text-white/80 border-white/10"
                          >
                            #{t}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div />
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={() => onSelect(n.id)}
                    className="shrink-0 ml-3 rounded-full border border-white/10 bg-white/10 p-2 text-white/80 hover:bg-white/20"
                  >
                    <PencilLine className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
