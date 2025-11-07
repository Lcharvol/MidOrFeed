import { broadcastNotification } from "@/lib/server/notification-hub";
import type { NotificationPayload, NotificationVariant } from "@/types";
import { NextResponse } from "next/server";
import { z } from "zod";

const notificationSchema = z.object({
  title: z.string().min(1).max(120),
  message: z.string().min(1).max(500),
  variant: z
    .union([
      z.literal("info"),
      z.literal("success"),
      z.literal("warning"),
      z.literal("error"),
    ])
    .optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = notificationSchema.parse(body);

    const payload: NotificationPayload = {
      id: crypto.randomUUID(),
      title: parsed.title,
      message: parsed.message,
      variant: (parsed.variant ?? "info") as NotificationVariant,
      createdAt: new Date().toISOString(),
    };

    broadcastNotification(payload);

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    console.error("Notification broadcast failure", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid notification payload" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Notification broadcast failed" },
      { status: 500 }
    );
  }
}
