import type { NotificationPayload } from "@/types";

type NotificationMessage = {
  type: "notification";
  payload: NotificationPayload;
};

type NotificationClientSet = Set<WebSocket>;

const notificationsGlobal = globalThis as unknown as {
  __notificationClients?: NotificationClientSet;
};

const clients: NotificationClientSet =
  notificationsGlobal.__notificationClients ?? new Set<WebSocket>();

if (!notificationsGlobal.__notificationClients) {
  notificationsGlobal.__notificationClients = clients;
}

const serializeMessage = (message: NotificationMessage): string =>
  JSON.stringify(message);

export const registerNotificationClient = (socket: WebSocket): void => {
  clients.add(socket);

  const removeClient = () => {
    clients.delete(socket);
  };

  socket.addEventListener("close", removeClient, { once: true });
  socket.addEventListener("error", removeClient, { once: true });
};

export const broadcastNotification = (payload: NotificationPayload): void => {
  const frame = serializeMessage({ type: "notification", payload });

  clients.forEach((client) => {
    try {
      client.send(frame);
    } catch (error) {
      console.error("Notification broadcast error", error);
      clients.delete(client);
    }
  });
};
