"use client";

import { useEffect, useMemo, useState } from "react";
import type { TasksItem, TaskStatus } from "./tasks.types";
import { KanbanColumn } from "./KanbanColumn";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { TaskCard } from "./TaskCard";

const COLUMNS: Array<{
  key: TaskStatus;
  title: string;
  dotClass: string;
}> = [
  { key: "todo", title: "To Do", dotClass: "bg-indigo-500" },
  { key: "in_progress", title: "In Progress", dotClass: "bg-amber-500" },
  { key: "completed", title: "Completed", dotClass: "bg-emerald-500" },
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
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [previewTasks, setPreviewTasks] = useState<TasksItem[]>(tasks);

  useEffect(() => {
    setPreviewTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  const collisionDetectionStrategy: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    return rectIntersection(args);
  };

  const activeTask = useMemo(
    () => previewTasks.find((task) => task.id === activeTaskId) ?? null,
    [previewTasks, activeTaskId],
  );

  function getTaskById(id: string) {
    return previewTasks.find((task) => task.id === id);
  }

  function resolveStatus(overId: string): TaskStatus | null {
    const overColumn = COLUMNS.find((col) => col.key === overId);
    if (overColumn) return overColumn.key;

    const overTask = getTaskById(overId);
    if (overTask) return overTask.status;

    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) {
      setActiveTaskId(null);
      return;
    }

    const activeId = String(active.id);
    const originalTask = tasks.find((task) => task.id === activeId);
    const nextStatus = resolveStatus(String(over.id));

    if (!originalTask || !nextStatus) {
      setActiveTaskId(null);
      return;
    }

    if (originalTask.status !== nextStatus) {
      onMove(activeId, nextStatus);
    }

    setActiveTaskId(null);
  }

  function handleDragCancel() {
    setActiveTaskId(null);
    setPreviewTasks(tasks);
  }

  return (
    <section
      className={cn(
        "rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl h-full",
        "shadow-[0_20px_60px_rgba(0,0,0,0.25)]",
        "p-3 sm:p-4 lg:p-5 w-full max-w-none",
      )}
    >
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

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="pb-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {COLUMNS.map((col) => {
              const colTasks = previewTasks.filter(
                (t) => t.status === col.key && t.id !== activeTaskId,
              );
              return (
                <div key={col.key} className="min-w-0">
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
                      status={col.key}
                      title={col.title}
                      dotClass={col.dotClass}
                      count={colTasks.length}
                      tasks={colTasks}
                      onCreate={() => onCreate(col.key)}
                      onOpen={onOpen}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {" "}
          {activeTask ? (
            <div className="rotate-1 opacity-95">
              <TaskCard task={activeTask} onOpen={() => {}} isDraggingOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}
