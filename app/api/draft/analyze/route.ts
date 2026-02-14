import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";
import { toError } from "@/lib/errors";
import type {
  DraftAnalyzeResponse,
  DraftAnalyzeTeamPick,
  LaneMatchup,
  TeamStats,
} from "@/types/draft";
import type { CompositionRole } from "@/lib/compositions/roles";
import { ROLE_PRIORITY } from "@/lib/compositions/roles";

const logger = createLogger("draft-analyze");

const pickSchema = z.object({
  championId: z.string().min(1),
  role: z.enum(["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]),
});

const draftSchema = z.object({
  bluePicks: z.array(pickSchema).length(5),
  redPicks: z.array(pickSchema).length(5),
});

export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = draftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Each team must have exactly 5 picks", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { bluePicks, redPicks } = parsed.data;

  try {
    const allChampionIds = [
      ...bluePicks.map((p) => p.championId),
      ...redPicks.map((p) => p.championId),
    ];

    // Fetch champion stats for all 10 champions
    const stats = await prisma.championStats.findMany({
      where: { championId: { in: allChampionIds } },
    });

    const statsMap = new Map(stats.map((s) => [s.championId, s]));

    // Compute team averages
    // Note: winRate from DB is already a percentage (e.g. 52.3, not 0.523)
    const computeTeamStats = (picks: DraftAnalyzeTeamPick[]): TeamStats => {
      let totalScore = 0;
      let totalWinRate = 0;
      let totalKDA = 0;
      let count = 0;

      for (const pick of picks) {
        const s = statsMap.get(pick.championId);
        if (s) {
          totalScore += s.score;
          totalWinRate += s.winRate; // already a percentage
          totalKDA += s.avgKDA;
          count++;
        }
      }

      return {
        avgScore: count > 0 ? totalScore / count : 0,
        avgWinRate: count > 0 ? totalWinRate / count : 50,
        avgKDA: count > 0 ? totalKDA / count : 0,
      };
    };

    const blueTeamStats = computeTeamStats(bluePicks);
    const redTeamStats = computeTeamStats(redPicks);

    // Compute lane matchups
    const laneMatchups: LaneMatchup[] = [];

    for (const role of ROLE_PRIORITY) {
      const bluePick = bluePicks.find((p) => p.role === role);
      const redPick = redPicks.find((p) => p.role === role);

      if (!bluePick || !redPick) continue;

      // Query head-to-head win rate from match_participants
      const matchupData = await prisma.$queryRaw<
        { games: bigint; blue_wins: bigint }[]
      >`
        SELECT
          COUNT(*) AS games,
          SUM(CASE WHEN p1.win THEN 1 ELSE 0 END) AS blue_wins
        FROM match_participants p1
        JOIN match_participants p2
          ON p1."matchId" = p2."matchId"
          AND p1."teamId" != p2."teamId"
        WHERE p1."championId" = ${bluePick.championId}
          AND p2."championId" = ${redPick.championId}
      `;

      const games = Number(matchupData[0]?.games ?? 0);
      const blueWins = Number(matchupData[0]?.blue_wins ?? 0);
      const blueWinRate = games > 0 ? blueWins / games : 0.5;

      laneMatchups.push({
        role: role as CompositionRole,
        blueChampionId: bluePick.championId,
        redChampionId: redPick.championId,
        blueWinRate,
        gamesPlayed: games,
      });
    }

    // Compute win probability
    // All components normalized to 0-1 range
    const avgLaneWinRate =
      laneMatchups.length > 0
        ? laneMatchups.reduce((sum, m) => sum + m.blueWinRate, 0) /
          laneMatchups.length
        : 0.5;

    // avgWinRate is a percentage (e.g. 52.3), convert to ratio
    const blueWinRateRatio = blueTeamStats.avgWinRate / 100;

    const scoreAdvantage =
      blueTeamStats.avgScore + redTeamStats.avgScore > 0
        ? blueTeamStats.avgScore /
          (blueTeamStats.avgScore + redTeamStats.avgScore)
        : 0.5;

    const rawProbability =
      0.4 * blueWinRateRatio +
      0.4 * avgLaneWinRate +
      0.2 * scoreAdvantage;

    const blueWinProbability = Math.min(0.95, Math.max(0.05, rawProbability));

    const response: DraftAnalyzeResponse = {
      blueWinProbability,
      redWinProbability: 1 - blueWinProbability,
      laneMatchups,
      blueTeamStats,
      redTeamStats,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    logger.error("Draft analyze error", toError(error));
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
