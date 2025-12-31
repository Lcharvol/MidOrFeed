import { NextResponse } from "next/server";
import { getQueue, QUEUE_NAMES } from "@/lib/queues";
import { isRedisAvailable } from "@/lib/redis";

type Params = { params: Promise<{ queue: string; jobId: string }> };

/**
 * GET /api/admin/jobs/[queue]/[jobId]
 * Get detailed info about a specific job
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const { queue: queueName, jobId } = await params;

    const validQueues = Object.values(QUEUE_NAMES);
    if (!validQueues.includes(queueName as typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES])) {
      return NextResponse.json(
        { error: `Invalid queue: ${queueName}` },
        { status: 400 }
      );
    }

    const redisAvailable = await isRedisAvailable();
    if (!redisAvailable) {
      return NextResponse.json(
        { error: "Redis not available" },
        { status: 503 }
      );
    }

    const queue = getQueue(queueName as typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES]);
    const job = await queue.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: `Job ${jobId} not found` },
        { status: 404 }
      );
    }

    const state = await job.getState();
    const progress = job.progress;

    return NextResponse.json({
      id: job.id,
      name: job.name,
      queue: queueName,
      data: job.data,
      progress: typeof progress === "object" ? progress : { current: 0, total: 0, percent: progress },
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      state,
      returnvalue: job.returnvalue,
    });
  } catch (error) {
    console.error("[Job API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/jobs/[queue]/[jobId]
 * Cancel/remove a specific job
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { queue: queueName, jobId } = await params;
    const url = new URL(request.url);
    const force = url.searchParams.get("force") === "true";

    const validQueues = Object.values(QUEUE_NAMES);
    if (!validQueues.includes(queueName as typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES])) {
      return NextResponse.json(
        { error: `Invalid queue: ${queueName}` },
        { status: 400 }
      );
    }

    const redisAvailable = await isRedisAvailable();
    if (!redisAvailable) {
      return NextResponse.json(
        { error: "Redis not available" },
        { status: 503 }
      );
    }

    const queue = getQueue(queueName as typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES]);
    const job = await queue.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: `Job ${jobId} not found` },
        { status: 404 }
      );
    }

    const state = await job.getState();

    // For active jobs, we need to move them to failed state
    if (state === "active") {
      if (force) {
        // Force remove - will mark as failed
        await job.moveToFailed(new Error("Cancelled by admin"), "admin-cancel", true);
        await job.remove();
      } else {
        // Just mark as failed without removing
        await job.moveToFailed(new Error("Cancelled by admin"), "admin-cancel", true);
      }
    } else {
      // For non-active jobs, just remove them
      await job.remove();
    }

    return NextResponse.json({
      success: true,
      jobId,
      queue: queueName,
      previousState: state,
      action: state === "active" ? "cancelled" : "removed",
    });
  } catch (error) {
    console.error("[Job API] Error cancelling job:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
