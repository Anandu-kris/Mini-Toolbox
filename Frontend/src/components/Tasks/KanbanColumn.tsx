import type { TasksItem, TaskStatus } from "./tasks.types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./TaskCard";
import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export function KanbanColumn({
  status,
  title,
  dotClass,
  count,
  tasks,
  onCreate,
  onOpen,
  disabledCreate = false,
}: {
  status: TaskStatus;
  title: string;
  dotClass: string;
  count: number;
  tasks: TasksItem[];
  onCreate: () => void;
  onOpen: (id: string) => void;
  disabledCreate?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl",
        "shadow-[0_18px_50px_rgba(0,0,0,0.22)]",
        "p-4 transition",
        isOver && "border-white/20 bg-white/[0.07]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", dotClass)} />
          <div className="text-base sm:text-lg font-semibold text-white leading-none">
            {title}
          </div>
        </div>

        <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
          {count}
        </div>
      </div>

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

      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="mt-4 space-y-4 min-h-[120px]">
          {tasks.length === 0 ? (
            <div
              className={cn(
                "rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-white/60 transition",
                isOver && "border-white/20 bg-white/[0.07] text-white/80",
              )}
            >
              Drop task here
            </div>
          ) : (
            tasks.map((t) => (
              <TaskCard key={t.id} task={t} onOpen={() => onOpen(t.id)} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
