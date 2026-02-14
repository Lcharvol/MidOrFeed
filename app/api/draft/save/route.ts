import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";
import { toError } from "@/lib/errors";

const logger = createLogger("draft-save");

const pickSchema = z.object({
  championId: z.string().min(1),
  role: z.string().min(1),
});

const teamStatsSchema = z.object({
  avgWinRate: z.number(),
  avgKDA: z.number(),
  avgScore: z.number(),
});

const saveSchema = z.object({
  analysis: z.object({
    blueWinProbability: z.number().min(0).max(1),
    blueTeamStats: teamStatsSchema,
    redTeamStats: teamStatsSchema,
  }),
  bluePicks: z.array(pickSchema).length(5),
  redPicks: z.array(pickSchema).length(5),
});

export const POST = async (request: NextRequest) => {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.ugc);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentification requise" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = saveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Données invalides" },
        { status: 400 }
      );
    }

    const { analysis, bluePicks, redPicks } = parsed.data;

    const entry = await prisma.draftHistory.create({
      data: {
        userId: user.id,
        blueWinProbability: analysis.blueWinProbability,
        bluePicks,
        redPicks,
        blueAvgWinRate: analysis.blueTeamStats.avgWinRate,
        blueAvgKDA: analysis.blueTeamStats.avgKDA,
        blueAvgScore: analysis.blueTeamStats.avgScore,
        redAvgWinRate: analysis.redTeamStats.avgWinRate,
        redAvgKDA: analysis.redTeamStats.avgKDA,
        redAvgScore: analysis.redTeamStats.avgScore,
      },
    });

    return NextResponse.json(
      { success: true, data: { id: entry.id } },
      { status: 201 }
    );
  } catch (error) {
    logger.error("POST error", toError(error));
    return NextResponse.json(
      { success: false, error: "Impossible de sauvegarder le draft." },
      { status: 500 }
    );
  }
};
