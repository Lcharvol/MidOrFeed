import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";
import { toError } from "@/lib/errors";

const logger = createLogger("draft-history");

export const GET = async (request: NextRequest) => {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentification requise" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get("limit"));
    const limit = Number.isFinite(limitParam)
      ? Math.max(1, Math.min(limitParam, 100))
      : 30;

    const history = await prisma.draftHistory.findMany({
      where: { userId: user.id },
      orderBy: { recordedAt: "desc" },
      take: limit,
      select: {
        id: true,
        blueWinProbability: true,
        bluePicks: true,
        redPicks: true,
        blueAvgWinRate: true,
        blueAvgKDA: true,
        blueAvgScore: true,
        redAvgWinRate: true,
        redAvgKDA: true,
        redAvgScore: true,
        recordedAt: true,
      },
    });

    const totalDrafts = await prisma.draftHistory.count({
      where: { userId: user.id },
    });

    const avgBlueWinRate =
      history.length > 0
        ? history.reduce((sum, h) => sum + h.blueWinProbability, 0) /
          history.length
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        history: history.map((h) => ({
          id: h.id,
          blueWinProbability: h.blueWinProbability,
          bluePicks: h.bluePicks,
          redPicks: h.redPicks,
          blueAvgWinRate: h.blueAvgWinRate,
          blueAvgKDA: h.blueAvgKDA,
          blueAvgScore: h.blueAvgScore,
          redAvgWinRate: h.redAvgWinRate,
          redAvgKDA: h.redAvgKDA,
          redAvgScore: h.redAvgScore,
          recordedAt: h.recordedAt.toISOString(),
        })),
        stats: {
          totalDrafts,
          avgBlueWinRate,
        },
      },
    });
  } catch (error) {
    logger.error("GET error", toError(error));
    return NextResponse.json(
      { success: false, error: "Impossible de récupérer l'historique." },
      { status: 500 }
    );
  }
};
