import type { NotificationPayload } from "@/types";

type NotificationMessage = {
  type: "notification";
  payload: NotificationPayload;
};

type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
};

type NotificationClientMap = Map<string, SSEClient>;

const notificationsGlobal = globalThis as unknown as {
  __notificationClients?: NotificationClientMap;
  __adminNotificationClients?: NotificationClientMap;
};

const clients: NotificationClientMap =
  notificationsGlobal.__notificationClients ?? new Map<string, SSEClient>();

if (!notificationsGlobal.__notificationClients) {
  notificationsGlobal.__notificationClients = clients;
}

// Admin clients for job notifications
const adminClients: NotificationClientMap =
  notificationsGlobal.__adminNotificationClients ?? new Map<string, SSEClient>();

if (!notificationsGlobal.__adminNotificationClients) {
  notificationsGlobal.__adminNotificationClients = adminClients;
}

const encoder = new TextEncoder();

const formatSSE = (data: string): Uint8Array => {
  return encoder.encode(`data: ${data}\n\n`);
};

export const registerSSEClient = (
  clientId: string,
  controller: ReadableStreamDefaultController<Uint8Array>
): void => {
  clients.set(clientId, { id: clientId, controller });
};

export const unregisterSSEClient = (clientId: string): void => {
  clients.delete(clientId);
};

export const getClientCount = (): number => clients.size;

export const broadcastNotification = (payload: NotificationPayload): void => {
  const message: NotificationMessage = { type: "notification", payload };
  const frame = formatSSE(JSON.stringify(message));

  clients.forEach((client, clientId) => {
    try {
      client.controller.enqueue(frame);
    } catch (error) {
      console.error(`SSE broadcast error for client ${clientId}:`, error);
      clients.delete(clientId);
    }
  });
};

export const sendHeartbeat = (): void => {
  const heartbeat = encoder.encode(`: heartbeat\n\n`);

  clients.forEach((client, clientId) => {
    try {
      client.controller.enqueue(heartbeat);
    } catch {
      clients.delete(clientId);
    }
  });
};

// Admin SSE client management
export const registerAdminSSEClient = (
  clientId: string,
  controller: ReadableStreamDefaultController<Uint8Array>
): void => {
  adminClients.set(clientId, { id: clientId, controller });
};

export const unregisterAdminSSEClient = (clientId: string): void => {
  adminClients.delete(clientId);
};

export const getAdminClientCount = (): number => adminClients.size;

export const broadcastToAdmins = (payload: NotificationPayload): void => {
  const message: NotificationMessage = { type: "notification", payload };
  const frame = formatSSE(JSON.stringify(message));

  adminClients.forEach((client, clientId) => {
    try {
      client.controller.enqueue(frame);
    } catch (error) {
      console.error(`SSE admin broadcast error for client ${clientId}:`, error);
      adminClients.delete(clientId);
    }
  });
};

export const sendAdminHeartbeat = (): void => {
  const heartbeat = encoder.encode(`: heartbeat\n\n`);

  adminClients.forEach((client, clientId) => {
    try {
      client.controller.enqueue(heartbeat);
    } catch {
      adminClients.delete(clientId);
    }
  });
};
