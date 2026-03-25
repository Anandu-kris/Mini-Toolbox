export type NotificationSeverity = "info" | "success" | "warning" | "error";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  severity?: NotificationSeverity;
};