// PomodoroTasks.tsx
import { Plus, Lock, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

export type PomodoroTask = {
  id: string;
  title: string;
  createdAt: number;
};

export default function PomodoroTasks({
  running,
  mode,
  activeTaskId,
  tasks,
  onAdd,
  onSetActive,
  onDelete,
}: {
  running: boolean;
  mode: "focus" | "short" | "long";
  activeTaskId: string | null;
  tasks: PomodoroTask[];
  onAdd: (title: string) => void;
  onSetActive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState("");

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeTaskId) ?? null,
    [tasks, activeTaskId],
  );

  const isLocked = running && mode === "focus";

  function handleAdd() {
    const title = draft.trim();
    if (!title) return;

    onAdd(title);
    setDraft("");
  }

  return (
    <div className="mt-12 w-2xl">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl shadow-[0_16px_50px_rgba(0,0,0,0.25)]">
        {/* header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-medium text-white/80">Tasks</div>
            <div className="mt-1 text-sm text-white/60">
              {activeTask ? (
                <span className="inline-flex items-center gap-2">
                  <span className="text-white/85">
                    Active: <span className="font-semibold">{activeTask.title}</span>
                  </span>
                  {isLocked && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/70">
                      <Lock className="h-3 w-3" /> locked
                    </span>
                  )}
                </span>
              ) : (
                "Pick one task to focus on"
              )}
            </div>
          </div>
        </div>

        {/* add row */}
        <div className="mt-4 flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a task…"
            disabled={isLocked}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
            className={[
              "h-11 w-full rounded-xl border border-white/12 bg-white/5 px-4 text-sm text-white",
              "outline-none placeholder:text-white/35",
              "focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40",
              isLocked ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
          />

          <button
            onClick={handleAdd}
            disabled={isLocked || !draft.trim()}
            className={[
              "grid h-11 w-11 place-items-center rounded-xl",
              "border border-white/10 bg-white/5 text-white/75 backdrop-blur-xl",
              "transition hover:bg-white/10 hover:text-white active:scale-[0.99]",
              (isLocked || !draft.trim()) ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
            title={isLocked ? "Focus running: tasks are locked" : "Add task"}
          >
            <Plus  strokeWidth={3} className="h-6 w-6" />
          </button>
        </div>

        {/* list */}
        <div className="mt-4 space-y-2">
          {tasks.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/55">
              No tasks yet. Add one above.
            </div>
          ) : (
            tasks.map((t) => {
              const active = t.id === activeTaskId;

              return (
                <div
                  key={t.id}
                  className={[
                    "flex items-center justify-between gap-3 rounded-xl px-4 py-3",
                    "border border-white/10 bg-white/5",
                    active ? "ring-1 ring-purple-500/55 bg-white/6" : "",
                    isLocked && !active ? "opacity-50" : "",
                  ].join(" ")}
                >
                  <button
                    onClick={() => {
                      if (isLocked) return; // lock switching during focus
                      onSetActive(t.id);
                    }}
                    className="flex flex-1 items-center gap-2 text-left"
                    title={
                      isLocked
                        ? "Focus running: cannot switch active task"
                        : "Set as active"
                    }
                    disabled={isLocked}
                  >
                    <span
                      className={[
                        "h-2.5 w-2.5 rounded-full",
                        active ? "bg-purple-400 shadow-[0_0_16px_rgba(168,85,247,0.8)]" : "bg-white/25",
                      ].join(" ")}
                    />
                    <span className="text-sm text-white/85">{t.title}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (isLocked && active) return; // don't delete active while locked
                      onDelete(t.id);
                    }}
                    disabled={isLocked && active}
                    className={[
                      "grid h-9 w-9 place-items-center rounded-lg",
                      "border border-white/10 bg-white/5 text-white/70",
                      "transition hover:bg-white/10 hover:text-white active:scale-[0.99]",
                      isLocked && active ? "opacity-50 cursor-not-allowed" : "",
                    ].join(" ")}
                    title={
                      isLocked && active
                        ? "Focus running: cannot delete active task"
                        : "Delete"
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* small helper */}
        <div className="mt-3 text-xs text-white/45">
          Tip: During <span className="text-white/65">Focus</span> running, task editing/switching is locked.
        </div>
      </div>
    </div>
  );
}
