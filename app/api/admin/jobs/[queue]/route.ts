import { NextResponse } from "next/server";
import { getJobQueue, QUEUE_NAMES } from "@/lib/job-queue";

type Params = { params: Promise<{ queue: string }> };

/**
 * GET /api/admin/jobs/[queue]
 * Get detailed status and jobs for a specific queue
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const { queue: queueName } = await params;

    // Validate queue name
    const validQueues = Object.values(QUEUE_NAMES);
    if (!validQueues.includes(queueName as typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES])) {
      return NextResponse.json(
        { error: `Invalid queue: ${queueName}` },
        { status: 400 }
      );
    }

    const boss = await getJobQueue();

    // Get queue stats
    const stats = await boss.getQueueStats(queueName);

    return NextResponse.json({
      queue: queueName,
      status: {
        waiting: stats.queuedCount,
        active: stats.activeCount,
        completed: 0,
        failed: 0,
        delayed: stats.deferredCount,
        paused: false,
      },
      jobs: [],
      message: "pg-boss queue - detailed job listing not available",
    });
  } catch (error) {
    console.error("[Queue API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/jobs/[queue]
 * Clean a queue (remove all jobs)
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { queue: queueName } = await params;
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "all";

    const validQueues = Object.values(QUEUE_NAMES);
    if (!validQueues.includes(queueName as typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES])) {
      return NextResponse.json(
        { error: `Invalid queue: ${queueName}` },
        { status: 400 }
      );
    }

    const boss = await getJobQueue();

    switch (type) {
      case "completed":
        await boss.deleteQueue(queueName);
        break;
      case "failed":
        await boss.deleteQueue(queueName);
        break;
      case "all":
        await boss.deleteQueue(queueName);
        break;
      default:
        return NextResponse.json(
          { error: `Invalid type: ${type}. Use: all, completed, failed` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      queue: queueName,
      cleaned: type,
    });
  } catch (error) {
    console.error("[Queue API] Error cleaning:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
