"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { TaskDraft, TaskStatus } from "./tasks.types";
import { KanbanBoard } from "./KanbanBoard";
import { TasksEditorDialog } from "./TasksEditorDialog";

import {
  useCreateTask,
  useDeleteTask,
  useTasksList,
  useUpdateTask,
} from "@/hooks/useTasks";

export function TasksSection() {
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // ✅ fetch from backend (optionally increase limit)
  const { data: tasks = [], isLoading } = useTasksList(
    { q, limit: 500, skip: 0 },
    true,
  );

  const selected = tasks.find((t) => t.id === selectedId) ?? null;

  const [draft, setDraft] = useState<TaskDraft>({
    title: "",
    note: "",
    dueAt: "",
    status: "todo",
  });

  // mutations
  const { mutateAsync: createTask, isPending: creating } = useCreateTask();
  const { mutateAsync: updateTask, isPending: updating } = useUpdateTask();
  const { mutateAsync: deleteTask, isPending: deleting } = useDeleteTask();

  // load selected -> draft
  useEffect(() => {
    if (!selected) return;

    setDraft({
      title: selected.title ?? "",
      note: selected.note ?? "",
      dueAt: selected.dueAt ? selected.dueAt.slice(0, 16) : "",
      status: selected.status,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const createTaskDialog = (status: TaskStatus) => {
    setIsCreating(true);
    setSelectedId("");
    setDraft({
      title: "",
      note: "",
      dueAt: "",
      status,
    });
    setEditorOpen(true);
  };

  const openTask = (id: string) => {
    setIsCreating(false);
    setSelectedId(id);
    setEditorOpen(true);
  };

  // ✅ confirm create -> backend POST
  const confirmCreate = async () => {
    const title = draft.title.trim();
    if (!title) {
      toast.error("Task title cannot be empty");
      return;
    }

    try {
      const created = await createTask({
        title,
        note: draft.note,
        dueAt: draft.dueAt ? new Date(draft.dueAt).toISOString() : null, // ✅ null clears
        status: draft.status,
      });

      setEditorOpen(false);
      setIsCreating(false);

      // optional: open the created task
      setSelectedId(created.id);

      toast.success("Task created");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to create task";
      toast.error(errorMessage);
    }
  };

  // ✅ delete -> backend DELETE
  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteTask(selected.id);
      setSelectedId("");
      setEditorOpen(false);
      toast.success("Task deleted");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to delete task";
      toast.error(errorMessage);
    }
  };

  // ✅ move -> backend PATCH status
  const moveTask = async (id: string, status: TaskStatus) => {
    try {
      await updateTask({ taskId: id, payload: { status } });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to move task";
      toast.error(errorMessage);
    }
  };

  // Confirm update (explicit) when editing an existing task
  const confirmUpdate = async () => {
    if (!selected) return;

    const title = draft.title.trim();
    if (!title) {
      toast.error("Task title cannot be empty");
      return;
    }

    try {
      await updateTask({
        taskId: selected.id,
        payload: {
          title,
          note: draft.note,
          status: draft.status,
          dueAt: draft.dueAt ? new Date(draft.dueAt).toISOString() : null,
        },
      });

      setEditorOpen(false);
      toast.success("Task updated");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to update task";
      toast.error(errorMessage);
    }
  };

  const cancelEdit = () => {
    // revert draft to selected's current values and close dialog
    if (selected) {
      setDraft({
        title: selected.title ?? "",
        note: selected.note ?? "",
        dueAt: selected.dueAt ? selected.dueAt.slice(0, 16) : "",
        status: selected.status,
      });
    }
    setEditorOpen(false);
    setIsCreating(false);
  };

  return (
    <>
      <KanbanBoard
        q={q}
        onQChange={setQ}
        tasks={tasks.map(task => ({ ...task, dueAt: task.dueAt ?? undefined }))} // backend already filters by q; still fine if you keep server filter
        onCreate={createTaskDialog}
        onOpen={openTask}
        onMove={moveTask}
      />

      <TasksEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        selected={selected ? { ...selected, dueAt: selected.dueAt ?? undefined } : null}
        draft={draft}
        onDraftChange={setDraft}
        onDelete={handleDelete}
        
        isCreating={isCreating}
        onConfirmCreate={confirmCreate}
        onConfirmUpdate={confirmUpdate}
        onCancelEdit={cancelEdit}
      />

      {/* optional loading hint */}
      {isLoading ? (
        <div className="mt-3 text-xs text-white/50">Loading tasks…</div>
      ) : null}

      {/* optional mutation hint */}
      {(creating || updating || deleting) ? (
        <div className="mt-1 text-xs text-white/40">Syncing…</div>
      ) : null}
    </>
  );
}