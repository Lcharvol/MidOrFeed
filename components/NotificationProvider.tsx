"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { useNotificationChannel } from "@/lib/hooks/use-notification-channel";
import { useAdminNotificationChannel } from "@/lib/hooks/use-admin-notification-channel";
import { useAuth } from "@/lib/auth-context";
import { isAdmin } from "@/types/roles";
import type { NotificationPayload, NotificationVariant } from "@/types";

export type NotificationContextValue = {
  notifications: NotificationPayload[];
  unreadIds: readonly string[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  clearUnread: () => void;
  status: "connecting" | "open" | "closed";
};

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

const toastByVariant: Record<
  NotificationVariant,
  (message: string, options?: Parameters<typeof toast>[1]) => string | number
> = {
  info: (message, options) => toast(message, options),
  success: (message, options) => toast.success(message, options),
  warning: (message, options) => toast.warning(message, options),
  error: (message, options) => toast.error(message, options),
};

const MAX_NOTIFICATIONS_DISPLAYED = 100;

type NotificationProviderProps = {
  children: ReactNode;
};

export const NotificationProvider = ({
  children,
}: NotificationProviderProps) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [unreadIds, setUnreadIds] = useState<string[]>([]);

  const handleNotification = useCallback((payload: NotificationPayload) => {
    setNotifications((previous) => {
      const next = [payload, ...previous];
      return next.slice(0, MAX_NOTIFICATIONS_DISPLAYED);
    });
    setUnreadIds((previous) => [payload.id, ...previous]);

    const notifier = toastByVariant[payload.variant] ?? toast;
    notifier(payload.title, {
      description: payload.message,
      duration: 6000,
    });
  }, []);

  const { state } = useNotificationChannel({
    onNotification: handleNotification,
  });

  // Admin channel for job notifications (only connects if user is admin)
  useAdminNotificationChannel({
    enabled: isAdmin(user?.role),
    onNotification: handleNotification,
  });

  const markAsRead = useCallback((id: string) => {
    setUnreadIds((previous) => previous.filter((value) => value !== id));
  }, []);

  const clearUnread = useCallback(() => {
    setUnreadIds([]);
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadIds,
      unreadCount: unreadIds.length,
      markAsRead,
      clearUnread,
      status: state,
    }),
    [notifications, unreadIds, markAsRead, clearUnread, state]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications doit être utilisé dans un NotificationProvider"
    );
  }
  return context;
};
