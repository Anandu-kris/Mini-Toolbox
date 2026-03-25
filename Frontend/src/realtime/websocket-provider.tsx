import { useEffect, useMemo, useState, type ReactNode } from "react";
import { WebSocketContext } from "@/context/websocket-context";
import { MiniToolboxWebSocketClient } from "./websocket-client";
import type {
  ConnectionStatus,
  RealtimeEvent,
  WebSocketContextValue,
} from "@/types/websocket.types";

type WebSocketProviderProps = {
  children: ReactNode;
  enabled: boolean;
};

export function WebSocketProvider({
  children,
  enabled,
}: WebSocketProviderProps) {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);

  const client = useMemo(() => {
    return new MiniToolboxWebSocketClient(() => {
      const base = import.meta.env.VITE_WS_BASE_URL ?? "ws://127.0.0.1:8000";
      return `${base}/ws`;
    });
  }, []);

  useEffect(() => {
    const unsubscribeStatus = client.subscribeStatus((nextStatus) => {
      setStatus(nextStatus);
    });

    const unsubscribeEvent = client.subscribe((event) => {
      setLastEvent(event);
    });

    if (enabled) {
      client.enableReconnect();
      client.connect();
    } else {
      client.disconnect();
      setStatus("idle");
      setLastEvent(null);
    }

    return () => {
      unsubscribeStatus();
      unsubscribeEvent();
    };
  }, [client, enabled]);

  const value: WebSocketContextValue = {
    client,
    status,
    lastEvent,
    send: (data) => client.send(data),
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}