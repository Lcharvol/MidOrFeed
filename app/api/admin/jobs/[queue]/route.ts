import { NextResponse } from "next/server";
import { getJobQueue, getQueueJobs, purgeQueue, QUEUE_NAMES, type QueueName } from "@/lib/job-queue";

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
    if (!validQueues.includes(queueName as QueueName)) {
      return NextResponse.json(
        { error: `Invalid queue: ${queueName}` },
        { status: 400 }
      );
    }

    const boss = await getJobQueue();
    const [stats, jobs] = await Promise.all([
      boss.getQueueStats(queueName),
      getQueueJobs(queueName as QueueName, 20),
    ]);

    return NextResponse.json({
      queue: queueName,
      status: {
        waiting: stats.queuedCount,
        active: stats.activeCount,
        total: stats.totalCount,
        deferred: stats.deferredCount,
      },
      jobs,
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
 * Purge jobs from a queue (without destroying the queue itself)
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { queue: queueName } = await params;

    const validQueues = Object.values(QUEUE_NAMES);
    if (!validQueues.includes(queueName as QueueName)) {
      return NextResponse.json(
        { error: `Invalid queue: ${queueName}` },
        { status: 400 }
      );
    }

    await purgeQueue(queueName as QueueName);

    return NextResponse.json({
      success: true,
      queue: queueName,
      cleaned: "all",
    });
  } catch (error) {
    console.error("[Queue API] Error cleaning:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
