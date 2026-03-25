import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/realtime/use-websocket";
import { useAppDispatch } from "@/store/hooks";
import {
  addNotification,
  clearIfDayChanged,
} from "@/store/slices/notificationsSlice";
import { notificationKeys } from "@/hooks/useNotifications";
import type {
  NotificationItem,
  NotificationsListResponse,
  NotificationUnreadCountResponse,
} from "@/services/notifications.service";

function isNotificationItem(value: unknown): value is NotificationItem {
  if (!value || typeof value !== "object") return false;

  const v = value as NotificationItem;
  return (
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    typeof v.message === "string"
  );
}

export default function AppRealtimeBootstrap() {
  const { lastEvent } = useWebSocket();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  useEffect(() => {
    dispatch(clearIfDayChanged());
  }, [dispatch]);

  useEffect(() => {
    if (!lastEvent) return;

    dispatch(clearIfDayChanged());

    if (lastEvent.type === "notification.created") {
      const payload = lastEvent.payload;

      if (!isNotificationItem(payload)) return;

      const incoming: NotificationItem = {
        ...payload,
        createdAt: payload.createdAt ?? new Date().toISOString(),
        updatedAt:
          payload.updatedAt ?? payload.createdAt ?? new Date().toISOString(),
        read: payload.read ?? false,
        severity: payload.severity ?? "info",
        meta: payload.meta ?? {},
      };

      const queries = queryClient.getQueriesData<NotificationsListResponse>({
        queryKey: notificationKeys.lists(),
      });

      for (const [queryKey, oldData] of queries) {
        if (!oldData) continue;

        const exists = oldData.items.some((item) => item.id === incoming.id);
        if (exists) continue;

        queryClient.setQueryData<NotificationsListResponse>(queryKey, {
          ...oldData,
          items: [incoming, ...oldData.items].slice(0, oldData.items.length),
          total: oldData.total + 1,
          unreadCount: oldData.unreadCount + (incoming.read ? 0 : 1),
        });
      }

      queryClient.setQueryData<NotificationUnreadCountResponse | undefined>(
        notificationKeys.unreadCount(),
        (old) => ({
          unreadCount: (old?.unreadCount ?? 0) + (incoming.read ? 0 : 1),
        }),
      );

      dispatch(
        addNotification({
          id: incoming.id,
          title: incoming.title,
          message: incoming.message,
          createdAt: incoming.createdAt,
          read: incoming.read,
          severity: incoming.severity,
        }),
      );

      return;
    }

    if (lastEvent.type === "notification.read") {
      const payload = lastEvent.payload as {
        id?: string;
        read?: boolean;
        updatedAt?: string;
      };

      if (!payload?.id) return;

      const queries = queryClient.getQueriesData<NotificationsListResponse>({
        queryKey: notificationKeys.lists(),
      });

      let unreadChanged = false;

      for (const [queryKey, oldData] of queries) {
        if (!oldData) continue;

        let touched = false;

        const items = oldData.items.map((item) => {
          if (item.id !== payload.id) return item;
          if (item.read) return item;

          touched = true;
          unreadChanged = true;

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

      if (unreadChanged) {
        queryClient.setQueryData<NotificationUnreadCountResponse | undefined>(
          notificationKeys.unreadCount(),
          (old) => ({
            unreadCount: Math.max(0, (old?.unreadCount ?? 0) - 1),
          }),
        );
      }

      return;
    }

    if (lastEvent.type === "notification.read_all") {
      const queries = queryClient.getQueriesData<NotificationsListResponse>({
        queryKey: notificationKeys.lists(),
      });

      for (const [queryKey, oldData] of queries) {
        if (!oldData) continue;

        const hasUnread = oldData.items.some((item) => !item.read);
        if (!hasUnread) continue;

        queryClient.setQueryData<NotificationsListResponse>(queryKey, {
          ...oldData,
          items: oldData.items.map((item) =>
            item.read ? item : { ...item, read: true },
          ),
          unreadCount: 0,
        });
      }

      queryClient.setQueryData<NotificationUnreadCountResponse>(
        notificationKeys.unreadCount(),
        { unreadCount: 0 },
      );
    }
  }, [lastEvent, dispatch, queryClient]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      dispatch(clearIfDayChanged());
    }, 60 * 1000);

    return () => window.clearInterval(interval);
  }, [dispatch]);

  return null;
}