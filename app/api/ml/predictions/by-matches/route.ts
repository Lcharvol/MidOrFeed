import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/ml/predictions/by-matches?matchIds=match1,match2,match3
 * Fetches ML win predictions for specific matches
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const matchIdsParam = searchParams.get("matchIds");
    const puuid = searchParams.get("puuid");

    if (!matchIdsParam) {
      return NextResponse.json(
        { success: false, error: "matchIds parameter required" },
        { status: 400 }
      );
    }

    const matchIds = matchIdsParam.split(",").filter(Boolean);

    if (matchIds.length === 0) {
      return NextResponse.json({ success: true, data: { predictions: {} } });
    }

    // Find the latest training run
    const latestRun = await prisma.mlTrainingRun.findFirst({
      orderBy: { startedAt: "desc" },
      where: { status: "completed" },
      select: { id: true },
    });

    if (!latestRun) {
      return NextResponse.json({
        success: true,
        data: { predictions: {}, noModel: true },
      });
    }

    // Build query filters
    const whereClause: {
      trainingRunId: string;
      matchId: { in: string[] };
      participantPUuid?: string;
    } = {
      trainingRunId: latestRun.id,
      matchId: { in: matchIds },
    };

    // If puuid is provided, filter by participant
    if (puuid) {
      whereClause.participantPUuid = puuid;
    }

    // Fetch predictions for the specified matches
    const predictions = await prisma.mlPrediction.findMany({
      where: whereClause,
      select: {
        matchId: true,
        participantPUuid: true,
        championId: true,
        winProbability: true,
      },
    });

    // Group predictions by matchId for easier access
    const predictionsByMatch: Record<
      string,
      {
        matchId: string;
        participantPUuid: string | null;
        championId: string;
        winProbability: number;
      }[]
    > = {};

    for (const pred of predictions) {
      if (!pred.matchId) continue;
      if (!predictionsByMatch[pred.matchId]) {
        predictionsByMatch[pred.matchId] = [];
      }
      predictionsByMatch[pred.matchId].push({
        matchId: pred.matchId,
        participantPUuid: pred.participantPUuid,
        championId: pred.championId,
        winProbability: pred.winProbability,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        predictions: predictionsByMatch,
        matchCount: Object.keys(predictionsByMatch).length,
      },
    });
  } catch (error) {
    console.error("Error fetching ML predictions by matches:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch predictions" },
      { status: 500 }
    );
  }
}
