import type { QueryClient } from "@tanstack/react-query";
import { notificationKeys } from "@/hooks/useNotifications";
import type {
  NotificationItem,
  NotificationsListResponse,
  NotificationUnreadCountResponse,
} from "@/services/notifications.service";

function isNotificationsListResponse(
  value: unknown
): value is NotificationsListResponse {
  if (!value || typeof value !== "object") return false;
  const v = value as NotificationsListResponse;
  return Array.isArray(v.items);
}

function isNotificationItem(value: unknown): value is NotificationItem {
  if (!value || typeof value !== "object") return false;
  const v = value as NotificationItem;
  return (
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    typeof v.message === "string"
  );
}

export function mergeCreatedNotificationIntoCache(
  queryClient: QueryClient,
  incoming: NotificationItem
) {
  if (!isNotificationItem(incoming)) return;

  const listQueries = queryClient.getQueriesData<NotificationsListResponse>({
    queryKey: notificationKeys.lists(),
  });

  for (const [queryKey, oldData] of listQueries) {
    if (!isNotificationsListResponse(oldData)) continue;

    const exists = oldData.items.some((item) => item.id === incoming.id);
    if (exists) continue;

    queryClient.setQueryData<NotificationsListResponse>(queryKey, {
      ...oldData,
      items: [incoming, ...oldData.items],
      total: oldData.total + 1,
      unreadCount: oldData.unreadCount + (incoming.read ? 0 : 1),
    });
  }

  queryClient.setQueryData<NotificationUnreadCountResponse | undefined>(
    notificationKeys.unreadCount(),
    (old) => ({
      unreadCount: (old?.unreadCount ?? 0) + (incoming.read ? 0 : 1),
    })
  );
}

export function mergeReadNotificationIntoCache(
  queryClient: QueryClient,
  payload: { id: string; read?: boolean; updatedAt?: string }
) {
  const listQueries = queryClient.getQueriesData<NotificationsListResponse>({
    queryKey: notificationKeys.lists(),
  });

  let changedUnread = false;

  for (const [queryKey, oldData] of listQueries) {
    if (!isNotificationsListResponse(oldData)) continue;

    let touched = false;

    const items = oldData.items.map((item) => {
      if (item.id !== payload.id) return item;
      if (item.read) return item;

      touched = true;
      changedUnread = true;

      return {
        ...item,
        read: true,
        updatedAt: payload.updatedAt ?? item.updatedAt,
      };
    });

    if (!touched) continue;

    queryClient.setQueryData<NotificationsListResponse>(queryKey, {
      ...oldData,
      items,
      unreadCount: Math.max(0, oldData.unreadCount - 1),
    });
  }

  if (changedUnread) {
    queryClient.setQueryData<NotificationUnreadCountResponse | undefined>(
      notificationKeys.unreadCount(),
      (old) => ({
        unreadCount: Math.max(0, (old?.unreadCount ?? 0) - 1),
      })
    );
  }
}

export function mergeReadAllNotificationsIntoCache(
  queryClient: QueryClient
) {
  const listQueries = queryClient.getQueriesData<NotificationsListResponse>({
    queryKey: notificationKeys.lists(),
  });

  for (const [queryKey, oldData] of listQueries) {
    if (!isNotificationsListResponse(oldData)) continue;

    const hasUnread = oldData.items.some((item) => !item.read);
    if (!hasUnread) continue;

    queryClient.setQueryData<NotificationsListResponse>(queryKey, {
      ...oldData,
      items: oldData.items.map((item) =>
        item.read ? item : { ...item, read: true }
      ),
      unreadCount: 0,
    });
  }

  queryClient.setQueryData<NotificationUnreadCountResponse>(
    notificationKeys.unreadCount(),
    { unreadCount: 0 }
  );
}