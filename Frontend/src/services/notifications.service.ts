import { api } from "@/lib/api";

export type NotificationSeverity = "info" | "success" | "warning" | "error";

export type NotificationMeta = {
  kind?: string;
  dayId?: string;
  source?: string;
  extra?: Record<string, unknown> | null;
};

export type NotificationItem = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  meta: NotificationMeta;
};

export type NotificationsListResponse = {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
};

export type NotificationUnreadCountResponse = {
  unreadCount: number;
};

export type MarkNotificationReadResponse = {
  message: string;
  item: NotificationItem;
};

export type MarkAllNotificationsReadResponse = {
  message: string;
  modifiedCount: number;
};

export type NotificationsListParams = {
  limit?: number;
  skip?: number;
  unreadOnly?: boolean;
};

export const notificationsService = {
  async list(params?: NotificationsListParams) {
    const response = await api.get<NotificationsListResponse>(
      "/api/notifications",
      {
        params: {
          limit: params?.limit ?? 20,
          skip: params?.skip ?? 0,
          unreadOnly: params?.unreadOnly ?? false,
        },
      },
    );
    return response.data;
  },

  async unreadCount() {
    const response = await api.get<NotificationUnreadCountResponse>(
      "/api/notifications/unread-count",
    );
    return response.data;
  },

  async markRead(notificationId: string) {
    const response = await api.post<MarkNotificationReadResponse>(
      `/api/notifications/${notificationId}/read`,
    );
    return response.data;
  },

  async markAllRead() {
    const response = await api.post<MarkAllNotificationsReadResponse>(
      "/api/notifications/read-all",
    );
    return response.data;
  },
};
