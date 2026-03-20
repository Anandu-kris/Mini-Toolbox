import { useEffect } from "react";
import { useWebSocket } from "@/realtime/use-websocket";
import { useAppDispatch } from "@/store/hooks";
import {
  addNotification,
  clearIfDayChanged,
} from "@/store/slices/notificationsSlice";
import type { AppNotification } from "@/types/notifications.types";

export default function AppRealtimeBootstrap() {
  const { lastEvent } = useWebSocket();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(clearIfDayChanged());
  }, [dispatch]);

  useEffect(() => {
    if (!lastEvent) return;

    dispatch(clearIfDayChanged());

    if (lastEvent.type !== "notification.created") return;

    const payload = lastEvent.payload as AppNotification;

    if (!payload?.id || !payload?.title || !payload?.message) return;

    dispatch(
      addNotification({
        id: payload.id,
        title: payload.title,
        message: payload.message,
        createdAt: payload.createdAt ?? new Date().toISOString(),
        read: payload.read ?? false,
        severity: payload.severity ?? "info",
      }),
    );
  }, [lastEvent, dispatch]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      dispatch(clearIfDayChanged());
    }, 60 * 1000);

    return () => window.clearInterval(interval);
  }, [dispatch]);

  return null;
}
