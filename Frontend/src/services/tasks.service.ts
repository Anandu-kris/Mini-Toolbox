import { api } from "@/lib/api";

export type TaskId = string;

export type TaskStatus = "todo" | "in_progress" | "completed";

export type TaskItem = {
  id: TaskId;
  title: string;
  note?: string;
  dueAt?: string | null; // ISO string or null
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export type TaskCreatePayload = {
  title: string;
  note?: string;
  dueAt?: string | null; // send null to clear
  status?: TaskStatus;
};

export type TaskUpdatePayload = {
  title?: string | null;
  note?: string | null;
  dueAt?: string | null; // send null to clear
  status?: TaskStatus | null;
};

export type TasksListParams = {
  limit?: number;
  skip?: number;
  q?: string;
  status?: TaskStatus;
};

export const tasksService = {
  // Create task
  create: async (payload: TaskCreatePayload): Promise<TaskItem> => {
    const normalized: TaskCreatePayload = {
      ...payload,
      // prefer null over empty string
      dueAt: payload.dueAt === "" ? null : payload.dueAt ?? null,
      status: payload.status ?? "todo",
    };

    const res = await api.post("/api/tasks/create", normalized);
    return res.data;
  },

  // List tasks
  list: async (params: TasksListParams = {}): Promise<TaskItem[]> => {
    const res = await api.get("/api/tasks", { params });
    return res.data;
  },

  // Get single task
  getById: async (taskId: TaskId): Promise<TaskItem> => {
    const res = await api.get(`/api/tasks/${taskId}`);
    return res.data;
  },

  // Update task
  update: async (taskId: TaskId, payload: TaskUpdatePayload): Promise<TaskItem> => {
    const normalized: TaskUpdatePayload = {
      ...payload,
      // prefer null over empty string
      dueAt: payload.dueAt === "" ? null : payload.dueAt,
    };

    const res = await api.patch(`/api/tasks/${taskId}`, normalized);
    return res.data;
  },

  // Delete task
  remove: async (taskId: TaskId): Promise<{ ok: true }> => {
    const res = await api.delete(`/api/tasks/${taskId}`);
    return res.data;
  },
};