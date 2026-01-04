import { NextResponse } from "next/server";
import { getJobQueue, QUEUE_NAMES } from "@/lib/job-queue";

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

    const boss = await getJobQueue();
    const job = await boss.getJobById(queueName, jobId);

    if (!job) {
      return NextResponse.json(
        { error: `Job ${jobId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: job.id,
      name: job.name,
      queue: queueName,
      data: job.data,
      progress: 0,
      timestamp: new Date(job.createdOn).getTime(),
      processedOn: job.startedOn ? new Date(job.startedOn).getTime() : null,
      finishedOn: job.completedOn ? new Date(job.completedOn).getTime() : null,
      failedReason: null,
      attemptsMade: job.retryCount,
      state: job.state,
      returnvalue: job.output,
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

    const validQueues = Object.values(QUEUE_NAMES);
    if (!validQueues.includes(queueName as typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES])) {
      return NextResponse.json(
        { error: `Invalid queue: ${queueName}` },
        { status: 400 }
      );
    }

    const boss = await getJobQueue();
    await boss.cancel(queueName, jobId);

    return NextResponse.json({
      success: true,
      jobId,
      queue: queueName,
      action: "cancelled",
    });
  } catch (error) {
    console.error("[Job API] Error cancelling job:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
