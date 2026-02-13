import { NextRequest, NextResponse } from "next/server";
import {
  getAllQueuesStatus,
  getRecentJobs,
  QUEUE_NAMES,
  sendJob,
  type QueueName,
} from "@/lib/job-queue";
import { requireAdmin } from "@/lib/auth-utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";

const logger = createLogger("admin-jobs");

/**
 * GET /api/admin/jobs
 * Get all queues status and recent jobs
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.admin);
  if (rateLimitResponse) return rateLimitResponse;

  // Verify admin access (skip CSRF for GET)
  const authError = await requireAdmin(request, { skipCsrf: true });
  if (authError) return authError;

  try {
    const [queuesStatus, recentJobs] = await Promise.all([
      getAllQueuesStatus(),
      getRecentJobs(30),
    ]);

    return NextResponse.json({
      connected: true,
      queues: queuesStatus,
      recentJobs,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error("Jobs API error", error as Error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        connected: false,
        queues: {},
        recentJobs: [],
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/jobs
 * Trigger a new job
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.admin);
  if (rateLimitResponse) return rateLimitResponse;

  // Verify admin access with CSRF validation
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { queue, data } = body as {
      queue: string;
      data?: Record<string, unknown>;
    };

    // Validate queue name
    const validQueues = Object.values(QUEUE_NAMES);
    if (!validQueues.includes(queue as QueueName)) {
      return NextResponse.json(
        { success: false, error: `Invalid queue: ${queue}. Valid queues: ${validQueues.join(", ")}` },
        { status: 400 }
      );
    }

    // Send job to pg-boss queue
    const jobId = await sendJob(queue as QueueName, data || {});

    return NextResponse.json({
      success: true,
      jobId,
      queue,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error("Jobs API error creating job", error as Error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
