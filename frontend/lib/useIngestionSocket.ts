"use client";

import { useState, useEffect, useRef } from "react";
import type { IngestionEvent } from "@/types";

const WS_BASE =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function useIngestionSocket(
  docId: string | null
): IngestionEvent | null {
  const [event, setEvent] = useState<IngestionEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!docId) {
      setEvent(null);
      return;
    }

    const ws = new WebSocket(`${WS_BASE}/ws/ingest/${docId}`);
    wsRef.current = ws;

    ws.onmessage = (msg) => {
      try {
        const data: IngestionEvent = JSON.parse(msg.data);
        setEvent(data);
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [docId]);

  return event;
}
