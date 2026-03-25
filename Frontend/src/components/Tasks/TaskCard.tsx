import type { TasksItem, TaskStatus } from "./tasks.types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

function isOverdue(dueAt?: string | null, status?: TaskStatus) {
  if (!dueAt) return false;
  if (status === "completed") return false;
  return new Date(dueAt).getTime() < Date.now();
}

export function TaskCard({
  task,
  onOpen,
  isDraggingOverlay = false,
}: {
  task: TasksItem;
  onOpen: () => void;
  isDraggingOverlay?: boolean;
}) {
  const overdue = isOverdue(task.dueAt, task.status);

  const tag =
    task.status === "completed"
      ? "OK"
      : overdue
        ? "High Priority"
        : "Important";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: isDraggingOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-full rounded-[22px] border border-white/10 bg-white/5 backdrop-blur-xl",
        "p-3 sm:p-4 transition",
        "shadow-[0_16px_45px_rgba(0,0,0,0.18)]",
        isDragging ? "opacity-40" : "hover:bg-white/8 hover:border-white/15",
        isDraggingOverlay && "shadow-[0_24px_70px_rgba(0,0,0,0.35)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 cursor-pointer" onClick={onOpen}>
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

          <div className="text-sm sm:text-base font-semibold text-white line-clamp-2">
            {task.title || "Untitled task"}
          </div>
        </div>

        <button
          type="button"
          aria-label="Drag task"
          className={cn(
            "shrink-0 rounded-xl border border-white/10 bg-white/5 p-2 text-white/60",
            "cursor-grab active:cursor-grabbing",
            "hover:bg-white/10 hover:text-white transition",
          )}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
