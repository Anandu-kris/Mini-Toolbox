import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import {
  tasksService,
  type TaskItem,
  type TaskCreatePayload,
  type TaskUpdatePayload,
  type TasksListParams,
  type TaskId,
} from "@/services/tasks.service";

type ApiErrorBody = {
  detail?: string;
  message?: string;
};

export const tasksKeys = {
  all: ["tasks"] as const,

  list: (params: TasksListParams) => ["tasks", "list", params] as const,

  byId: (id: TaskId) => ["tasks", "byId", id] as const,
};

// List tasks
export function useTasksList(params: TasksListParams = {}, enabled = true) {
  return useQuery<TaskItem[], AxiosError<ApiErrorBody>>({
    queryKey: tasksKeys.list(params),
    queryFn: () => tasksService.list(params),
    enabled,
    staleTime: 60_000,
  });
}

// Get a task by id
export function useTask(taskId: TaskId, enabled = true) {
  return useQuery<TaskItem, AxiosError<ApiErrorBody>>({
    queryKey: tasksKeys.byId(taskId),
    queryFn: () => tasksService.getById(taskId),
    enabled: enabled && !!taskId,
    staleTime: 60_000,
  });
}

// Create task
export function useCreateTask() {
  const qc = useQueryClient();

  return useMutation<TaskItem, AxiosError<ApiErrorBody>, TaskCreatePayload>({
    mutationFn: tasksService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tasksKeys.all });
    },
  });
}

// Update task
export function useUpdateTask() {
  const qc = useQueryClient();

  return useMutation<
    TaskItem,
    AxiosError<ApiErrorBody>,
    { taskId: TaskId; payload: TaskUpdatePayload }
  >({
    mutationFn: ({ taskId, payload }) => tasksService.update(taskId, payload),
    onSuccess: (updated) => {
      // update single cache
      qc.setQueryData(tasksKeys.byId(updated.id), updated);

      // refresh lists (board + search results)
      qc.invalidateQueries({ queryKey: tasksKeys.all });
    },
  });
}

// Delete task
export function useDeleteTask() {
  const qc = useQueryClient();

  return useMutation<{ ok: true }, AxiosError<ApiErrorBody>, TaskId>({
    mutationFn: (taskId) => tasksService.remove(taskId),
    onSuccess: (_res, taskId) => {
      // remove single cache
      qc.removeQueries({ queryKey: tasksKeys.byId(taskId) });

      // refresh lists
      qc.invalidateQueries({ queryKey: tasksKeys.all });
    },
  });
}