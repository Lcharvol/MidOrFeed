import { NextResponse } from "next/server";
import { getQueue, QUEUE_NAMES } from "@/lib/queues";
import { isRedisAvailable } from "@/lib/redis";

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

    const redisAvailable = await isRedisAvailable();
    if (!redisAvailable) {
      return NextResponse.json(
        { error: "Redis not available" },
        { status: 503 }
      );
    }

    const queue = getQueue(queueName as typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES]);

    // Get queue metrics
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused(),
    ]);

    // Get jobs in various states
    const [waitingJobs, activeJobs, completedJobs, failedJobs] = await Promise.all([
      queue.getJobs(["waiting"], 0, 20),
      queue.getJobs(["active"], 0, 20),
      queue.getJobs(["completed"], 0, 20),
      queue.getJobs(["failed"], 0, 20),
    ]);

    const formatJob = async (job: Awaited<ReturnType<typeof queue.getJobs>>[0]) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      state: await job.getState(),
    });

    const jobs = await Promise.all([
      ...activeJobs.map(formatJob),
      ...waitingJobs.map(formatJob),
      ...completedJobs.map(formatJob),
      ...failedJobs.map(formatJob),
    ]);

    return NextResponse.json({
      queue: queueName,
      status: {
        waiting,
        active,
        completed,
        failed,
        delayed,
        paused,
      },
      jobs: jobs.sort((a, b) => b.timestamp - a.timestamp),
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
    const type = url.searchParams.get("type") || "all"; // all, completed, failed

    const validQueues = Object.values(QUEUE_NAMES);
    if (!validQueues.includes(queueName as typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES])) {
      return NextResponse.json(
        { error: `Invalid queue: ${queueName}` },
        { status: 400 }
      );
    }

    const queue = getQueue(queueName as typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES]);

    switch (type) {
      case "completed":
        await queue.clean(0, 1000, "completed");
        break;
      case "failed":
        await queue.clean(0, 1000, "failed");
        break;
      case "all":
        await queue.obliterate({ force: true });
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
