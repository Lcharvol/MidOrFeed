import { NextRequest, NextResponse } from "next/server";
import { getJobQueue, getQueueJobs, purgeQueue, QUEUE_NAMES, type QueueName } from "@/lib/job-queue";
import { requireAdmin } from "@/lib/auth-utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ queue: string }> };

/**
 * GET /api/admin/jobs/[queue]
 * Get detailed status and jobs for a specific queue
 */
export async function GET(request: NextRequest, { params }: Params) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.admin);
  if (rateLimitResponse) return rateLimitResponse;

  const authError = await requireAdmin(request, { skipCsrf: true });
  if (authError) return authError;

  try {
    const { queue: queueName } = await params;

    // Validate queue name
    const validQueues = Object.values(QUEUE_NAMES);
    if (!validQueues.includes(queueName as QueueName)) {
      return NextResponse.json(
        { success: false, error: `Invalid queue: ${queueName}` },
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
    logger.error("Error fetching queue", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/jobs/[queue]
 * Purge jobs from a queue (without destroying the queue itself)
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.admin);
  if (rateLimitResponse) return rateLimitResponse;

  const authError = await requireAdmin(request, { skipCsrf: true });
  if (authError) return authError;

  try {
    const { queue: queueName } = await params;

    const validQueues = Object.values(QUEUE_NAMES);
    if (!validQueues.includes(queueName as QueueName)) {
      return NextResponse.json(
        { success: false, error: `Invalid queue: ${queueName}` },
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
    logger.error("Error cleaning queue", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
