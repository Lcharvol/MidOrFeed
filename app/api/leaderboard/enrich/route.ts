import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sendJob, QUEUE_NAMES } from "@/lib/job-queue";
import { createLogger } from "@/lib/logger";
import { toError } from "@/lib/errors";

const logger = createLogger("leaderboard-enrich");

const schema = z.object({
  regions: z.array(z.string()).optional(),
  limit: z.number().int().positive().max(500).optional(),
});

/**
 * POST /api/leaderboard/enrich
 * Dispatches a leaderboard-enrich job to the worker queue.
 * Admin-only endpoint for manual triggering.
 */
export async function POST(req: NextRequest) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.admin);
  if (rateLimitResponse) return rateLimitResponse;

  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const jobId = await sendJob(QUEUE_NAMES.LEADERBOARD_ENRICH, {
      regions: parsed.data.regions,
      limit: parsed.data.limit,
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: "Leaderboard enrich job dispatched",
    });
  } catch (e) {
    logger.error("Failed to dispatch enrich job", toError(e));
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}
