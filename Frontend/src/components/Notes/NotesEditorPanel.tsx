import { ArrowLeft, NotebookText, RotateCcw, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import RichTextEditor from "./RichTextEdtor";
import { AiFloatingPanel } from "./ai/AiFloatingPanel";
import type { NoteItem } from "@/services/notes.service";

type SaveState = "idle" | "dirty" | "saving" | "saved";

type NotesEditorPanelProps = {
  isNotesOrTrash: boolean;
  trashed: boolean;
  selected: NoteItem | null;

  draft: { title: string; contentHtml: string; tags: string[] };
  onDraftChange: (
    next:
      | { title: string; contentHtml: string; tags: string[] }
      | ((prev: { title: string; contentHtml: string; tags: string[] }) => {
          title: string;
          contentHtml: string;
          tags: string[];
        }),
  ) => void;

  tagInput: string;
  onTagInputChange: (v: string) => void;

  saveState: SaveState;

  onMoveToTrash: () => void;
  onRestore: () => void;
  onDeleteForever: () => void;

  onAddTag: () => void;
  onRemoveTag: (t: string) => void;

  updatePending?: boolean;
  deletePending?: boolean;
  onBack: () => void;
};

function SaveStateText({ saveState }: { saveState: SaveState }) {
  if (saveState === "saving") {
    return <span className="text-white/70">Saving…</span>;
  }

  if (saveState === "saved") {
    return <span className="text-emerald-300">Saved</span>;
  }

  if (saveState === "dirty") {
    return <span className="text-amber-300">Unsaved changes</span>;
  }

  return <span className="text-white/40">Up to date</span>;
}

export function NotesEditorPanel({
  isNotesOrTrash,
  trashed,
  selected,
  draft,
  onDraftChange,
  tagInput,
  onTagInputChange,
  saveState,
  onMoveToTrash,
  onRestore,
  onDeleteForever,
  onAddTag,
  onRemoveTag,
  updatePending = false,
  deletePending = false,
  onBack,
}: NotesEditorPanelProps) {
  return (
    <section className="relative h-full min-h-0 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl flex flex-col">
      {!isNotesOrTrash ? (
        <div className="text-white/70">Select “Notes” or “Trash” from the left.</div>
      ) : !selected ? (
        <div className="text-white/70">Select a note to start editing.</div>
      ) : (
        <>
          {/* Top Bar */}
          <div className="flex flex-col gap-4 border-b border-white/10 pb-2 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-row gap-10 items-center min-w-0">
              <button
                type="button"
                onClick={onBack}
                className="mb-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to notes
              </button>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60">
                <span>Updated • {new Date(selected.updatedAt).toLocaleString()}</span>
                {!trashed ? <SaveStateText saveState={saveState} /> : null}
              </div>
            </div>

            {trashed ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={onRestore}
                  className="gap-2"
                  disabled={updatePending}
                >
                  <RotateCcw className="h-4 w-4" />
                  Restore
                </Button>

                <Button
                  variant="destructive"
                  onClick={onDeleteForever}
                  disabled={deletePending}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete forever
                </Button>
              </div>
            ) : (
              <Button
                variant="destructive"
                onClick={onMoveToTrash}
                disabled={updatePending}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Move to Trash
              </Button>
            )}
          </div>

          {/* Title + Tags side by side */}
          <div className="mt-3 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
            {/* Title */}
            <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
              <div className="flex gap-2 mb-3 items-center text-sm text-white/70"><NotebookText className="h-4 w-4"/>Title</div>
              <Input
                value={draft.title}
                onChange={(e) =>
                  onDraftChange((d) => ({ ...d, title: e.target.value }))
                }
                placeholder="Untitled"
                disabled={trashed}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 font-semibold"
              />
            </div>

            {/* Tags */}
            <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm text-white/80">
                <Tag className="h-4 w-4" />
                Tags
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={tagInput}
                  onChange={(e) => onTagInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onAddTag();
                    }
                  }}
                  placeholder="Add tag and press Enter"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  disabled={trashed}
                />

                <Button
                  type="button"
                  variant="secondary"
                  onClick={onAddTag}
                  disabled={trashed}
                >
                  Add
                </Button>
              </div>

              {draft.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {draft.tags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => !trashed && onRemoveTag(t)}
                      title={trashed ? undefined : "Remove tag"}
                      className="rounded-full"
                    >
                      <Badge className="border border-white/10 bg-white/10 text-white hover:bg-white/15">
                        #{t}
                      </Badge>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* Editor */}
          <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-white/3">
            <div className="h-full min-h-0 p-3">
              <RichTextEditor
                key={selected.id}
                value={draft.contentHtml}
                onChange={(html) =>
                  onDraftChange((d) => ({ ...d, contentHtml: html }))
                }
                disabled={trashed}
              />
            </div>
          </div>

          <AiFloatingPanel
            noteId={selected?.id}
            disabled={trashed}
            onOpenSource={(nid, snippet) => {
              console.log("open source", nid, snippet);
            }}
            onApplyToEditor={(plainText) => {
              const html = plainText
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map(
                  (line) =>
                    `<p>${line
                      .replaceAll("&", "&amp;")
                      .replaceAll("<", "&lt;")
                      .replaceAll(">", "&gt;")}</p>`,
                )
                .join("");

              onDraftChange((d) => ({ ...d, contentHtml: html }));
            }}
          />

          {trashed ? (
            <div className="mt-3 text-xs text-white/50">
              This note is in Trash. Restore it to edit.
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}