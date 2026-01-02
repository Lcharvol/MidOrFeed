import { NextRequest, NextResponse } from "next/server";
import {
  getAllQueuesStatus,
  getRecentJobs,
  QUEUE_NAMES,
  getQueue,
} from "@/lib/queues";
import { isRedisAvailable } from "@/lib/redis";
import { requireAdmin } from "@/lib/auth-utils";
import type { ChampionStatsJobData, CompositionJobData } from "@/lib/queues/types";

/**
 * GET /api/admin/jobs
 * Get all queues status and recent jobs
 */
export async function GET(request: NextRequest) {
  // Verify admin access (skip CSRF for GET)
  const authError = await requireAdmin(request, { skipCsrf: true });
  if (authError) return authError;

  try {
    // Check Redis availability
    const redisAvailable = await isRedisAvailable();
    if (!redisAvailable) {
      return NextResponse.json(
        {
          error: "Redis not available",
          redisConnected: false,
          queues: {},
          recentJobs: [],
        },
        { status: 503 }
      );
    }

    const [queuesStatus, recentJobs] = await Promise.all([
      getAllQueuesStatus(),
      getRecentJobs(30),
    ]);

    return NextResponse.json({
      redisConnected: true,
      queues: queuesStatus,
      recentJobs,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[Jobs API] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        redisConnected: false,
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
  // Verify admin access with CSRF protection
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
    if (!validQueues.includes(queue as typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES])) {
      return NextResponse.json(
        { error: `Invalid queue: ${queue}. Valid queues: ${validQueues.join(", ")}` },
        { status: 400 }
      );
    }

    // Check Redis availability
    const redisAvailable = await isRedisAvailable();
    if (!redisAvailable) {
      return NextResponse.json(
        { error: "Redis not available" },
        { status: 503 }
      );
    }

    // Get the queue and add job
    const q = getQueue(queue as typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES]);

    // Generate job name with timestamp
    const jobName = `${queue}-${Date.now()}`;

    const job = await q.add(jobName, data || {}, {
      jobId: jobName,
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      queue,
      name: jobName,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[Jobs API] Error creating job:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
