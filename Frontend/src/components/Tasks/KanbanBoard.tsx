"use client";

import type { TasksItem, TaskStatus } from "./tasks.types";
import { KanbanColumn } from "./KanbanColumn";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const COLUMNS: Array<{
  key: TaskStatus;
  title: string;
  dotClass: string;
}> = [
  {
    key: "todo",
    title: "To Do",
    dotClass: "bg-indigo-500",
  },
  {
    key: "in_progress",
    title: "In Progress",
    dotClass: "bg-amber-500",
  },
  {
    key: "completed",
    title: "Completed",
    dotClass: "bg-emerald-500",
  },
];

export function KanbanBoard({
  q,
  onQChange,
  tasks,
  onCreate,
  onOpen,
  onMove,
  loading = false,
}: {
  q: string;
  onQChange: (v: string) => void;
  tasks: TasksItem[];
  onCreate: (status: TaskStatus) => void;
  onOpen: (id: string) => void;
  onMove: (id: string, status: TaskStatus) => void;
  loading?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl h-full",
        "shadow-[0_20px_60px_rgba(0,0,0,0.25)]",
        "p-5 w-full max-w-none",
      )}
    >
      {/* Search */}
      <div className="mb-5">
        <Input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Search tasks..."
          className={cn(
            "h-11 rounded-2xl",
            "bg-white/5 border-white/10 text-white placeholder:text-white/40",
            "focus-visible:ring-1 focus-visible:ring-white/20",
          )}
        />
      </div>

      {/* board */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-5 min-w-fit">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);

            return (
              <div key={col.key} className="w-[382px] shrink-0">
                {loading ? (
                  <div
                    className={cn(
                      "rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl",
                      "shadow-[0_18px_50px_rgba(0,0,0,0.22)]",
                      "p-4 animate-pulse",
                    )}
                  >
                    <div className="h-5 w-40 rounded bg-white/10" />
                    <div className="mt-4 h-11 w-full rounded-full bg-white/10" />
                    <div className="mt-4 space-y-4">
                      <div className="h-24 rounded-3xl bg-white/10" />
                      <div className="h-24 rounded-3xl bg-white/10" />
                    </div>
                  </div>
                ) : (
                  <KanbanColumn
                    title={col.title}
                    dotClass={col.dotClass}
                    count={colTasks.length}
                    tasks={colTasks}
                    onCreate={() => onCreate(col.key)}
                    onOpen={onOpen}
                    onMove={onMove}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
