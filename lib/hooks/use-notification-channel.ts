import { useEffect, useRef, useState } from "react";
import type { NotificationPayload } from "@/types";

export type NotificationChannelState = "connecting" | "open" | "closed";

export type NotificationChannelOptions = {
  onNotification?: (payload: NotificationPayload) => void;
};

const WEBSOCKET_PATH = "/api/notifications/socket";
const RECONNECT_DELAY_MS = 4_000;

const isNotificationMessage = (
  value: unknown
): value is { type: "notification"; payload: NotificationPayload } => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.type !== "notification") return false;
  const payload = record.payload as Partial<NotificationPayload> | undefined;
  return (
    !!payload &&
    typeof payload.id === "string" &&
    typeof payload.title === "string" &&
    typeof payload.message === "string" &&
    typeof payload.createdAt === "string" &&
    typeof payload.variant === "string"
  );
};

const buildSocketUrl = () => {
  if (typeof window === "undefined") return "";
  const url = new URL(WEBSOCKET_PATH, window.location.origin);
  url.protocol = url.protocol.replace("http", "ws");
  return url.toString();
};

export const useNotificationChannel = (
  options: NotificationChannelOptions = {}
) => {
  const { onNotification } = options;
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const [state, setState] = useState<NotificationChannelState>("connecting");

  useEffect(() => {
    let cancelled = false;

    const clearReconnect = () => {
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      clearReconnect();
      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (!cancelled) {
          connect();
        }
      }, RECONNECT_DELAY_MS);
    };

    const handleMessage = (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data) as unknown;
        if (isNotificationMessage(data)) {
          onNotification?.(data.payload);
        }
      } catch (error) {
        console.error("Invalid notification message", error);
      }
    };

    const connect = () => {
      const socketUrl = buildSocketUrl();
      if (!socketUrl) return;

      try {
        setState("connecting");
        const socket = new WebSocket(socketUrl);
        socketRef.current = socket;

        socket.addEventListener("open", () => {
          if (cancelled) return;
          setState("open");
        });

        socket.addEventListener("message", handleMessage as EventListener);

        socket.addEventListener("close", () => {
          if (cancelled) return;
          setState("closed");
          scheduleReconnect();
        });

        socket.addEventListener("error", () => {
          if (cancelled) return;
          setState("closed");
          scheduleReconnect();
        });
      } catch (error) {
        console.error("Notification socket creation failed", error);
        setState("closed");
        scheduleReconnect();
      }
    };

    connect();

    return () => {
      cancelled = true;
      clearReconnect();
      const socket = socketRef.current;
      if (socket?.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [onNotification]);

  return { state };
};
