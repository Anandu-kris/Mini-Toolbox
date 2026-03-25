export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export type RealtimeEvent<T = Record<string, unknown>> = {
  id?: string;
  type: string;
  timestamp?: string;
  userId?: string;
  module?: string;
  payload: T;
  meta?: Record<string, unknown>;
};

export type WebSocketContextValue = {
  client: {
    send: (data: Record<string, unknown>) => void;
    subscribe: (callback: (event: RealtimeEvent) => void) => () => void;
    subscribeStatus: (callback: (status: ConnectionStatus) => void) => () => void;
    connect: () => void;
    disconnect: () => void;
  } | null;
  status: ConnectionStatus;
  lastEvent: RealtimeEvent | null;
  send: (data: Record<string, unknown>) => void;
};