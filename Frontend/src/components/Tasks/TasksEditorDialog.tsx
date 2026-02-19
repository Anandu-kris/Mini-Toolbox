"use client";

import { useMemo } from "react";
import { X } from "lucide-react";

import type { TasksItem, TaskDraft, TaskStatus } from "./tasks.types";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type TasksEditorDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  selected: TasksItem | null;

  draft: TaskDraft;
  onDraftChange: React.Dispatch<React.SetStateAction<TaskDraft>>;

  onDelete: () => void;

  isCreating: boolean;
  onConfirmCreate: () => void;
  onConfirmUpdate: () => void;
  onCancelEdit: () => void;
};

export function TasksEditorDialog({
  open,
  onOpenChange,
  selected,
  draft,
  onDraftChange,
  onDelete,
  isCreating,
  onConfirmCreate,
  onConfirmUpdate,
  onCancelEdit,
}: TasksEditorDialogProps) {
  const overdue = useMemo(() => {
    if (!draft.dueAt) return false;
    if (draft.status === "completed") return false;
    return new Date(draft.dueAt).getTime() < Date.now();
  }, [draft.dueAt, draft.status]);

  const setStatus = (status: TaskStatus) => {
    onDraftChange((d) => ({ ...d, status }));
  };

  // determine if any editable field changed compared to selected
  const isDirty = (() => {
    if (!selected) return false;
    const selTitle = selected.title ?? "";
    const selNote = selected.note ?? "";
    const selDue = selected.dueAt ? selected.dueAt.slice(0, 16) : "";

    return (
      draft.title !== selTitle ||
      draft.note !== selNote ||
      (draft.dueAt ?? "") !== selDue
    );
  })();

  const statusBtn = (active: boolean) =>
    cn(
      "rounded-full px-4 h-9 text-sm",
      "border border-white/10 bg-white/5 text-white/80 backdrop-blur-xl",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_12px_30px_rgba(0,0,0,0.25)]",
      "hover:bg-white/10 hover:text-white transition",
      active && "bg-white/15 border-white/20 text-white",
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-2xl rounded-3xl",
          "border border-white/10 bg-white/5 backdrop-blur-xl text-white",
          "shadow-[0_30px_90px_rgba(0,0,0,0.45)]",
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-white">
            {isCreating ? "Create Task" : "Edit Task"}
          </DialogTitle>
        </DialogHeader>

        {!isCreating && !selected ? (
          <div className="text-white/70">Select a task.</div>
        ) : (
          <>
            {!isCreating && selected && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-white/60">
                  Updated • {new Date(selected.updatedAt).toLocaleString()}
                </div>

                <div className="flex items-center gap-2">
                  {overdue ? (
                    <Badge className="bg-red-500/10 text-red-200 border border-red-500/20">
                      Overdue
                    </Badge>
                  ) : null}

                  <Button variant="destructive" onClick={onDelete}>
                    Delete
                  </Button>
                </div>
              </div>
            )}

            {!isCreating && (
              <div className="mt-1 flex flex-wrap gap-2">
                <Button
                  type="button"
                  className={statusBtn(draft.status === "todo")}
                  onClick={() => setStatus("todo")}
                >
                  To Do
                </Button>

                <Button
                  type="button"
                  className={statusBtn(draft.status === "in_progress")}
                  onClick={() => setStatus("in_progress")}
                >
                  In Progress
                </Button>

                <Button
                  type="button"
                  className={statusBtn(draft.status === "completed")}
                  onClick={() => setStatus("completed")}
                >
                  Completed
                </Button>
              </div>
            )}

            {/* Title */}
            <div className="mt-2">
              <Input
                value={draft.title}
                onChange={(e) =>
                  onDraftChange((d) => ({ ...d, title: e.target.value }))
                }
                className="h-11 rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-white/40 font-semibold"
                placeholder="Task title"
              />
            </div>

            {/* Due */}
            <div className="mt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-white/60 block mb-2">
                  Due date
                </label>

                {draft.dueAt ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onDraftChange((d) => ({ ...d, dueAt: "" }))}
                    className="text-xs inline-flex items-center gap-1 text-white/80 hover:text-black"
                    title="Clear due date"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                ) : null}
              </div>

              <Input
                type="datetime-local"
                value={draft.dueAt}
                onChange={(e) =>
                  onDraftChange((d) => ({ ...d, dueAt: e.target.value }))
                }
                className="h-11 mt-1 rounded-2xl bg-white/5 border-white/10 text-white"
              />

              <div className="mt-1 text-[11px] text-white/45">
                Tip: leave empty for “no due date”.
              </div>
            </div>

            {/* Note */}
            <div className="mt-1">
              <label className="text-xs text-white/60 block mb-2">Note</label>
              <textarea
                value={draft.note}
                onChange={(e) =>
                  onDraftChange((d) => ({ ...d, note: e.target.value }))
                }
                placeholder="Add details..."
                className={cn(
                  "w-full min-h-[220px] rounded-3xl border p-4 outline-none resize-none font-mono",
                  "bg-white/5 border-white/10 text-white placeholder:text-white/40",
                )}
              />
            </div>

            {!isCreating && selected && (
              <DialogFooter className="mt-6 gap-2">
                <Button
                  type="button"
                  onClick={() => onCancelEdit()}
                  className={cn(
                    "rounded-2xl",
                    "border border-white/20 bg-white/20 text-white/95 backdrop-blur-lg",
                    "hover:bg-white/30 hover:text-white transition",
                  )}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={onConfirmUpdate}
                  disabled={!isDirty}
                  aria-disabled={!isDirty}
                  className={cn(
                    "rounded-2xl text-white",
                    "border border-white/10",
                    isDirty
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-blue-600/30 cursor-not-allowed",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_14px_40px_rgba(0,0,0,0.28)]",
                  )}
                >
                  Update
                </Button>
              </DialogFooter>
            )}

            {isCreating && (
              <DialogFooter className="mt-6 gap-2">
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "rounded-2xl",
                    "border border-white/10 bg-white/20 text-white/95 backdrop-blur-xl",
                    "hover:bg-white/30 hover:text-white transition",
                  )}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={onConfirmCreate}
                  className={cn(
                    "rounded-2xl text-white",
                    "border border-white/10 bg-blue-600  backdrop-blur-xl",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_14px_40px_rgba(0,0,0,0.35)]",
                    "hover:bg-blue-700 transition",
                  )}
                >
                  Create
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
