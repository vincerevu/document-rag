import { useRef, useCallback } from "react";
import type { StreamEvent } from "@/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = useCallback(
    (
      conversationId: string,
      message: string,
      onEvent: (event: StreamEvent) => void
    ) => {
      return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(
          `${WS_URL}/ws/chat/${conversationId}`
        );
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(JSON.stringify({ message }));
        };

        ws.onmessage = (event) => {
          const data: StreamEvent = JSON.parse(event.data);
          onEvent(data);
          if (data.type === "done") {
            ws.close();
            resolve();
          }
        };

        ws.onerror = () => {
          reject(new Error("WebSocket connection failed"));
        };

        ws.onclose = () => {
          wsRef.current = null;
        };
      });
    },
    []
  );

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  return { sendMessage, disconnect };
}
