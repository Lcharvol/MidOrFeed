import { registerNotificationClient } from "@/lib/server/notification-hub";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export function GET(request: NextRequest): Response {
  if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return new Response("Expected websocket", { status: 400 });
  }

  const { 0: client, 1: server } = new WebSocketPair();

  server.accept();
  registerNotificationClient(server);

  server.addEventListener("message", (event) => {
    if (typeof event.data === "string" && event.data === "ping") {
      server.send("pong");
    }
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}
