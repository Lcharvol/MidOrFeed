import { NextRequest } from "next/server";
import {
  registerAdminSSEClient,
  unregisterAdminSSEClient,
} from "@/lib/server/notification-hub";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/jwt";
import { isAdmin } from "@/types/roles";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  // Get token from HTTP-only cookie
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return new Response("Unauthorized: No token", { status: 401 });
  }

  // Verify JWT token
  const payload = await verifyToken(token);

  if (!payload || !payload.userId) {
    return new Response("Unauthorized: Invalid token", { status: 401 });
  }

  // Check admin role
  if (!isAdmin(payload.role)) {
    return new Response("Forbidden: Admin role required", { status: 403 });
  }

  const clientId = crypto.randomUUID();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Register admin client
      registerAdminSSEClient(clientId, controller);

      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "connected", clientId })}\n\n`
        )
      );
    },
    cancel() {
      // Unregister admin client when connection closes
      unregisterAdminSSEClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
