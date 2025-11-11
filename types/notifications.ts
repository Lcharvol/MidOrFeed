export type NotificationVariant = "info" | "success" | "warning" | "error";

export interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  variant: NotificationVariant;
  createdAt: string;
}


