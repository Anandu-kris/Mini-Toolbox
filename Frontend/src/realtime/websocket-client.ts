import type { ConnectionStatus, RealtimeEvent } from "@/types/websocket.types";

type EventCallback = (event: RealtimeEvent) => void;
type StatusCallback = (status: ConnectionStatus) => void;

export class MiniToolboxWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private listeners = new Set<EventCallback>();
  private statusListeners = new Set<StatusCallback>();

  private reconnectDelay = 3000;
  private manuallyClosed = false;
  private reconnectEnabled = true;

  public status: ConnectionStatus = "idle";

  private readonly urlFactory: () => string | null;

  constructor(urlFactory: () => string | null) {
    this.urlFactory = urlFactory;
  }

  connect() {
    const url = this.urlFactory();
    console.log("[WS] connect called", { url });

    if (!url) return;
    if (!this.reconnectEnabled) return;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) return;

    this.manuallyClosed = false;
    this.setStatus("connecting");

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("[WS] open");
      this.setStatus("connected");
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      // console.log("[WS] message", event.data);
      try {
        const parsed = JSON.parse(event.data) as RealtimeEvent;
        this.listeners.forEach((cb) => cb(parsed));
      } catch (error) {
        console.error("[WebSocket] Failed to parse message", error);
      }
    };

    this.ws.onerror = (error) => {
      console.error("[WS] error", error);
      this.setStatus("error");
    };

    this.ws.onclose = (event) => {
      console.log("[WS] close", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        manuallyClosed: this.manuallyClosed,
        reconnectEnabled: this.reconnectEnabled,
      });

      this.stopHeartbeat();
      this.ws = null;

      if (this.manuallyClosed || !this.reconnectEnabled) {
        this.setStatus("disconnected");
        return;
      }

      this.setStatus("disconnected");
      this.scheduleReconnect();
    };
  }

  disconnect() {
    this.manuallyClosed = true;
    this.reconnectEnabled = false;
    this.clearReconnect();
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setStatus("disconnected");
  }

  enableReconnect() {
    this.reconnectEnabled = true;
  }

  disableReconnect() {
    this.reconnectEnabled = false;
    this.clearReconnect();
  }

  send(data: Record<string, unknown>) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(data));
  }

  subscribe(callback: EventCallback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  subscribeStatus(callback: StatusCallback) {
    this.statusListeners.add(callback);
    callback(this.status);

    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private setStatus(next: ConnectionStatus) {
    this.status = next;
    this.statusListeners.forEach((cb) => cb(next));
  }

  private scheduleReconnect() {
    if (!this.reconnectEnabled) return;
    if (this.reconnectTimer !== null) return;

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelay);
  }

  private clearReconnect() {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();

    this.heartbeatTimer = window.setInterval(() => {
      this.send({ action: "ping" });
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
