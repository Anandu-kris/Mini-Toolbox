import type { ReactNode } from "react";
import { WebSocketProvider } from "@/realtime/websocket-provider";
import { useCurrentUser } from "@/hooks/useAuth";

export default function AppProviders({ children }: { children: ReactNode }) {
  const { data: me, isSuccess } = useCurrentUser();

  const websocketEnabled = Boolean(isSuccess && me);

  return (
    <WebSocketProvider enabled={websocketEnabled}>
      {children}
    </WebSocketProvider>
  );
}