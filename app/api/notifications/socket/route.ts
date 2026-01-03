import {
  registerSSEClient,
  unregisterSSEClient,
} from "@/lib/server/notification-hub";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const clientId = crypto.randomUUID();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Register client
      registerSSEClient(clientId, controller);

      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected", clientId })}\n\n`)
      );
    },
    cancel() {
      // Unregister client when connection closes
      unregisterSSEClient(clientId);
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
