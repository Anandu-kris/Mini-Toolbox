import { RotateCcw, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import RichTextEditor from "./RichTextEdtor";

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
};

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
}: NotesEditorPanelProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
      {!isNotesOrTrash ? (
        <div className="text-white/70">
          Select “Notes” or “Trash” from the left.
        </div>
      ) : !selected ? (
        <div className="text-white/70">Select a note to start editing.</div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-white/60 flex items-center gap-3">
              <span>
                Updated • {new Date(selected.updatedAt).toLocaleString()}
              </span>

              {!trashed && (
                <span className="text-xs">
                  {saveState === "saving" ? (
                    <span className="text-white/70">Saving…</span>
                  ) : saveState === "saved" ? (
                    <span className="text-emerald-300">Saved</span>
                  ) : saveState === "dirty" ? (
                    <span className="text-amber-300">Unsaved changes</span>
                  ) : null}
                </span>
              )}
            </div>

            {trashed ? (
              <div className="flex items-center gap-2">
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
                >
                  Delete forever
                </Button>
              </div>
            ) : (
              <Button
                variant="destructive"
                onClick={onMoveToTrash}
                disabled={updatePending}
              >
                Move to Trash
              </Button>
            )}
          </div>

          {/* Title */}
          <div className="mt-4">
            <Input
              value={draft.title}
              onChange={(e) =>
                onDraftChange((d) => ({ ...d, title: e.target.value }))
              }
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 font-semibold"
              placeholder="Untitled"
              disabled={trashed}
            />
          </div>

          {/* Tags */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/4 p-4">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-3">
              <Tag className="h-4 w-4" />
              Tags
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={tagInput}
                onChange={(e) => onTagInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onAddTag();
                  }
                }}
                placeholder="Add tag (press Enter)"
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

            {draft.tags.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {draft.tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => !trashed && onRemoveTag(t)}
                    title={trashed ? undefined : "Remove tag"}
                  >
                    <Badge className="bg-white/10 text-white border border-white/10 hover:bg-white/15">
                      #{t}
                    </Badge>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Content */}
          <div className="mt-4">
            <RichTextEditor
              value={draft.contentHtml}
              onChange={(html) =>
                onDraftChange((d) => ({ ...d, contentHtml: html }))
              }
              disabled={trashed}
            />
          </div>

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
