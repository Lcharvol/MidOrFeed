"use client";

import { useMemo, useState } from "react";
import { BellIcon, CheckIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/components/NotificationProvider";
import type { NotificationPayload } from "@/types";
import { cn } from "@/lib/utils";

const MAX_VISIBLE_NOTIFICATIONS = 10;

const formatRelativeTime = (isoDate: string) => {
  const date = new Date(isoDate);
  const diff = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) {
    return "à l'instant";
  }
  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes} min`;
  }
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours} h`;
  }
  const days = Math.floor(diff / day);
  return `${days} j`;
};

const variantBadgeMap: Record<NotificationPayload["variant"], string> = {
  info: "bg-blue-500/15 text-blue-100",
  success: "bg-emerald-500/15 text-emerald-100",
  warning: "bg-amber-500/15 text-amber-100",
  error: "bg-rose-500/15 text-rose-100",
};

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    unreadIds,
    clearUnread,
    markAsRead,
    status,
  } = useNotifications();

  const unreadSet = useMemo(() => new Set(unreadIds), [unreadIds]);

  const visibleNotifications = useMemo(
    () => notifications.slice(0, MAX_VISIBLE_NOTIFICATIONS),
    [notifications]
  );

  const isLoading = status === "connecting" && notifications.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="pointer-events-none absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {status === "open" ? "Connecté" : "Connexion en cours"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => clearUnread()}
            >
              <CheckIcon className="mr-1 h-3 w-3" />
              Tout lu
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[320px]">
          <div className="grid gap-2 p-4">
            {isLoading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Connexion au flux…
              </div>
            )}
            {!isLoading && visibleNotifications.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-1 py-8 text-center text-sm text-muted-foreground">
                <BellIcon className="h-5 w-5" />
                Pas encore de notifications
              </div>
            )}
            {visibleNotifications.map((notification) => {
              const isUnread = unreadSet.has(notification.id);
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "rounded-lg border bg-background/60 p-3 shadow-sm transition-colors",
                    isUnread
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold leading-tight">
                      {notification.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-semibold capitalize",
                          variantBadgeMap[notification.variant]
                        )}
                      >
                        {notification.variant}
                      </Badge>
                      {isUnread && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <CheckIcon className="h-3 w-3" />
                          <span className="sr-only">Marquer comme lu</span>
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-snug text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="mt-3 text-right text-[11px] font-medium text-muted-foreground">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
