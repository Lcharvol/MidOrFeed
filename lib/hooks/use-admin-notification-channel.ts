import { useEffect, useRef, useState } from "react";
import type { NotificationPayload } from "@/types";

export type AdminNotificationChannelState = "connecting" | "open" | "closed" | "disabled";

export type AdminNotificationChannelOptions = {
  enabled?: boolean;
  onNotification?: (payload: NotificationPayload) => void;
};

const SSE_PATH = "/api/notifications/admin-socket";
const RECONNECT_DELAY_MS = 5_000;

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

/**
 * Hook for admin users to receive job notifications via SSE.
 * Only connects if enabled=true (user is admin).
 */
export const useAdminNotificationChannel = (
  options: AdminNotificationChannelOptions = {}
) => {
  const { enabled = false, onNotification } = options;
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const [state, setState] = useState<AdminNotificationChannelState>(
    enabled ? "connecting" : "disabled"
  );

  useEffect(() => {
    // Don't connect if not enabled
    if (!enabled) {
      setState("disabled");
      return;
    }

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

    const connect = () => {
      if (typeof window === "undefined") return;

      try {
        setState("connecting");
        const eventSource = new EventSource(SSE_PATH, { withCredentials: true });
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          if (cancelled) return;
          setState("open");
        };

        eventSource.onmessage = (event) => {
          if (cancelled) return;
          try {
            const data = JSON.parse(event.data) as unknown;
            if (isNotificationMessage(data)) {
              onNotification?.(data.payload);
            }
          } catch (error) {
            console.error("Invalid admin notification message", error);
          }
        };

        eventSource.onerror = () => {
          if (cancelled) return;
          setState("closed");
          eventSource.close();
          scheduleReconnect();
        };
      } catch (error) {
        console.error("Admin SSE connection failed", error);
        setState("closed");
        scheduleReconnect();
      }
    };

    connect();

    return () => {
      cancelled = true;
      clearReconnect();
      eventSourceRef.current?.close();
    };
  }, [enabled, onNotification]);

  return { state };
};
