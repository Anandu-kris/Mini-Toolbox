import type { TasksItem, TaskStatus } from "./tasks.types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./TaskCard";
import { Plus } from "lucide-react";

export function KanbanColumn({
  title,
  dotClass,
  count,
  tasks,
  onCreate,
  onOpen,
  onMove,
  disabledCreate = false,
  movingId,
}: {
  title: string;
  dotClass: string;
  count: number;
  tasks: TasksItem[];
  onCreate: () => void;
  onOpen: (id: string) => void;
  onMove: (id: string, status: TaskStatus) => void;

  // ✅ optional (useful with API)
  disabledCreate?: boolean;
  movingId?: string | null; // pass id of task being moved if you want
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl",
        "shadow-[0_18px_50px_rgba(0,0,0,0.22)]",
        "p-4",
      )}
    >
      {/* header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", dotClass)} />
          <div className="text-lg font-semibold text-white leading-none">
            {title}
          </div>
        </div>

        <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
          {count}
        </div>
      </div>

      {/* Add button */}
      <Button
        onClick={onCreate}
        disabled={disabledCreate}
        className={cn(
          "mt-4 h-11 w-full rounded-full text-white font-medium",
          "glass-btn",
          title === "To Do" && "glass-indigo",
          title === "In Progress" && "glass-amber",
          title === "Completed" && "glass-green",
          disabledCreate && "opacity-60 cursor-not-allowed",
        )}
      >
        <Plus className="mr-2 h-4 w-4 opacity-90" />
        Add New Task
      </Button>

      {/* cards */}
      <div className="mt-4 space-y-4">
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-white/60">
            No tasks here.
          </div>
        ) : (
          tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onOpen={() => onOpen(t.id)}
              onMove={onMove}
              isMoving={movingId === t.id}
            />
          ))
        )}
      </div>
    </div>
  );
}