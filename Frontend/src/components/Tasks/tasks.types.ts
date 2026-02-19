export type TaskStatus = "todo" | "in_progress" | "completed";

export type TasksItem = {
  id: string;
  title: string;
  note?: string;
  dueAt?: string; // ISO string or undefined
  status: TaskStatus;
  updatedAt: string; // ISO string
};

export type TaskDraft = {
  title: string;
  note: string;
  dueAt: string;
  status: TaskStatus;
};
