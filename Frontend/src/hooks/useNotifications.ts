import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import {
  notificationsService,
  type NotificationItem,
  type NotificationsListParams,
  type NotificationsListResponse,
  type NotificationUnreadCountResponse,
  type MarkAllNotificationsReadResponse,
  type MarkNotificationReadResponse,
} from "@/services/notifications.service";

type ApiErrorBody = {
  detail?: string;
  message?: string;
};

export const notificationKeys = {
  all: ["notifications"] as const,

  lists: () => [...notificationKeys.all, "list"] as const,
  list: (params: NotificationsListParams = {}) =>
    [...notificationKeys.lists(), params] as const,

  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

function patchNotificationInLists(
  oldData: NotificationsListResponse | undefined,
  notificationId: string,
  updater: (item: NotificationItem) => NotificationItem,
): NotificationsListResponse | undefined {
  if (!oldData) return oldData;

  let changed = false;

  const items = oldData.items.map((item) => {
    if (item.id !== notificationId) return item;
    changed = true;
    return updater(item);
  });

  if (!changed) return oldData;

  return {
    ...oldData,
    items,
    unreadCount: items.filter((item) => !item.read).length,
  };
}

function markAllReadInList(
  oldData: NotificationsListResponse | undefined,
): NotificationsListResponse | undefined {
  if (!oldData) return oldData;

  const hasUnread = oldData.items.some((item) => !item.read);
  if (!hasUnread) return oldData;

  return {
    ...oldData,
    items: oldData.items.map((item) =>
      item.read ? item : { ...item, read: true },
    ),
    unreadCount: 0,
  };
}

export function useNotifications(params?: NotificationsListParams) {
  const safeParams: NotificationsListParams = {
    limit: params?.limit ?? 20,
    skip: params?.skip ?? 0,
    unreadOnly: params?.unreadOnly ?? false,
  };

  return useQuery<NotificationsListResponse, AxiosError<ApiErrorBody>>({
    queryKey: notificationKeys.list(safeParams),
    queryFn: () => notificationsService.list(safeParams),
    staleTime: 30_000,
  });
}

export function useUnreadNotificationCount() {
  return useQuery<NotificationUnreadCountResponse, AxiosError<ApiErrorBody>>({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsService.unreadCount(),
    staleTime: 15_000,
  });
}

type MarkNotificationReadContext = {
  previousLists: Array<
    [readonly unknown[], NotificationsListResponse | undefined]
  >;
  previousUnreadCount?: NotificationUnreadCountResponse;
};

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation<
    MarkNotificationReadResponse,
    AxiosError<ApiErrorBody>,
    string,
    MarkNotificationReadContext
  >({
    mutationFn: (notificationId: string) =>
      notificationsService.markRead(notificationId),

    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      const previousLists =
        queryClient.getQueriesData<NotificationsListResponse>({
          queryKey: notificationKeys.lists(),
        });
      const previousUnreadCount =
        queryClient.getQueryData<NotificationUnreadCountResponse>(
          notificationKeys.unreadCount(),
        );

      for (const [queryKey, data] of previousLists) {
        queryClient.setQueryData<NotificationsListResponse | undefined>(
          queryKey,
          patchNotificationInLists(data, notificationId, (item) => ({
            ...item,
            read: true,
          })),
        );
      }

      if (previousUnreadCount) {
        queryClient.setQueryData<NotificationUnreadCountResponse>(
          notificationKeys.unreadCount(),
          {
            unreadCount: Math.max(0, previousUnreadCount.unreadCount - 1),
          },
        );
      }

      return { previousLists, previousUnreadCount };
    },

    onError: (_error, _notificationId, context) => {
      if (!context) return;

      for (const [queryKey, data] of context.previousLists) {
        queryClient.setQueryData(queryKey, data);
      }

      if (context.previousUnreadCount) {
        queryClient.setQueryData(
          notificationKeys.unreadCount(),
          context.previousUnreadCount,
        );
      }
    },

    onSuccess: (data) => {
      const updatedItem = data.item;

      const currentLists =
        queryClient.getQueriesData<NotificationsListResponse>({
          queryKey: notificationKeys.lists(),
        });

      for (const [queryKey, oldData] of currentLists) {
        queryClient.setQueryData<NotificationsListResponse | undefined>(
          queryKey,
          patchNotificationInLists(oldData, updatedItem.id, () => updatedItem),
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
    },
  });
}

type MarkAllNotificationsReadContext = {
  previousLists: Array<
    [readonly unknown[], NotificationsListResponse | undefined]
  >;
  previousUnreadCount?: NotificationUnreadCountResponse;
};

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation<
    MarkAllNotificationsReadResponse,
    AxiosError<ApiErrorBody>,
    void,
    MarkAllNotificationsReadContext
  >({
    mutationFn: () => notificationsService.markAllRead(),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      const previousLists =
        queryClient.getQueriesData<NotificationsListResponse>({
          queryKey: notificationKeys.lists(),
        });
      const previousUnreadCount =
        queryClient.getQueryData<NotificationUnreadCountResponse>(
          notificationKeys.unreadCount(),
        );

      for (const [queryKey, data] of previousLists) {
        queryClient.setQueryData<NotificationsListResponse | undefined>(
          queryKey,
          markAllReadInList(data),
        );
      }

      queryClient.setQueryData<NotificationUnreadCountResponse>(
        notificationKeys.unreadCount(),
        { unreadCount: 0 },
      );

      return { previousLists, previousUnreadCount };
    },

    onError: (_error, _variables, context) => {
      if (!context) return;

      for (const [queryKey, data] of context.previousLists) {
        queryClient.setQueryData(queryKey, data);
      }

      if (context.previousUnreadCount) {
        queryClient.setQueryData(
          notificationKeys.unreadCount(),
          context.previousUnreadCount,
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
    },
  });
}
