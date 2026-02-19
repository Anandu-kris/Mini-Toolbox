import type { TasksItem, TaskStatus } from "./tasks.types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MoveRight, Loader2 } from "lucide-react";

function isOverdue(dueAt?: string | null, status?: TaskStatus) {
  if (!dueAt) return false;
  if (status === "completed") return false;
  return new Date(dueAt).getTime() < Date.now();
}

export function TaskCard({
  task,
  onOpen,
  onMove,
  isMoving = false,
}: {
  task: TasksItem;
  onOpen: () => void;
  onMove: (id: string, status: TaskStatus) => void;
  isMoving?: boolean;
}) {
  const overdue = isOverdue(task.dueAt, task.status);

  const tag =
    task.status === "completed"
      ? "OK"
      : overdue
        ? "High Priority"
        : "Important";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "w-full text-left rounded-[22px] border border-white/10 bg-white/5 backdrop-blur-xl",
        "p-4 transition",
        "hover:bg-white/8 hover:border-white/15",
        "shadow-[0_16px_45px_rgba(0,0,0,0.18)]", 
      )}
    >
      <Badge
        className={cn(
          "mb-2 rounded-full border px-2 py-0.5 text-[11px]",
          "bg-white/5 text-white/80 border-white/10",
          overdue && "bg-red-500/10 text-red-200 border-red-500/20",
          task.status === "completed" &&
            "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
        )}
      >
        {tag}
      </Badge>

      <div className="text-base font-semibold text-white line-clamp-2">
        {task.title || "Untitled task"}
      </div>

      <div className="mt-4 flex items-center justify-end">
        <button
          type="button"
          disabled={isMoving}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs",
            "border border-white/10 bg-white/5 text-white/80 backdrop-blur-xl",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_25px_rgba(0,0,0,0.22)]",
            "hover:bg-white/10 hover:text-white transition",
            isMoving && "opacity-60 cursor-not-allowed",
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (isMoving) return;

            const next: TaskStatus =
              task.status === "todo"
                ? "in_progress"
                : task.status === "in_progress"
                  ? "completed"
                  : "todo";

            onMove(task.id, next);
          }}
          title="Quick move"
        >
          {isMoving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Moving
            </>
          ) : (
            <>
              <MoveRight className="h-4 w-4" />
              Move
            </>
          )}
        </button>
      </div>
    </button>
  );
}