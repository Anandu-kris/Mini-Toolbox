import { createContext } from "react";
import type { WebSocketContextValue } from "@/types/websocket.types";

export const WebSocketContext =
  createContext<WebSocketContextValue | null>(null);