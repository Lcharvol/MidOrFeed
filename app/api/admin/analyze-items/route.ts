import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const SUMMONERS_RIFT_MAP_ID = 11;
const MIN_GAMES_FOR_SCORE = 10;

const clampMatchLimit = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const normalized = Math.round(parsed);
  if (normalized <= 0) return null;
  return Math.min(Math.max(normalized, 50), 1000);
};

export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.admin);
  if (rateLimitResponse) return rateLimitResponse;

  const authError = await requireAdmin(request, { skipCsrf: true });
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => null);
    const matchLimit = clampMatchLimit(body?.matchLimit);

    logger.info("Début de l'analyse des items", { matchLimit });

    // Fetch matches on Summoner's Rift only
    let matchIds: string[] | null = null;
    if (matchLimit) {
      const latestMatches = await prisma.match.findMany({
        select: { id: true },
        where: { mapId: SUMMONERS_RIFT_MAP_ID },
        orderBy: { gameCreation: "desc" },
        take: matchLimit,
      });
      matchIds = latestMatches.map((m) => m.id);
    }

    const participants = await prisma.matchParticipant.findMany({
      select: {
        win: true,
        kills: true,
        deaths: true,
        assists: true,
        item0: true,
        item1: true,
        item2: true,
        item3: true,
        item4: true,
        item5: true,
        item6: true,
      },
      where: {
        ...(matchIds
          ? { matchId: { in: matchIds } }
          : { match: { mapId: SUMMONERS_RIFT_MAP_ID } }),
      },
      take: matchIds ? undefined : 50000,
    });

    if (participants.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun participant trouvé" },
        { status: 400 }
      );
    }

    const totalMatches = matchIds
      ? matchIds.length
      : await prisma.match.count({ where: { mapId: SUMMONERS_RIFT_MAP_ID } });

    // Aggregate stats by itemId
    const statsByItem = new Map<
      string,
      { games: number; wins: number; kills: number; deaths: number; assists: number }
    >();

    for (const p of participants) {
      // Collect unique non-zero items for this participant
      const items = new Set<number>();
      for (const slot of [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6]) {
        if (slot && slot > 0) items.add(slot);
      }

      for (const itemId of items) {
        const key = String(itemId);
        const existing = statsByItem.get(key) ?? {
          games: 0,
          wins: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
        };

        existing.games++;
        if (p.win) existing.wins++;
        existing.kills += p.kills;
        existing.deaths += p.deaths;
        existing.assists += p.assists;

        statsByItem.set(key, existing);
      }
    }

    // Compute normalized scores
    const allStats = Array.from(statsByItem.entries()).map(([itemId, stats]) => {
      const winRate = stats.games > 0 ? (stats.wins / stats.games) * 100 : 0;
      const pickRate = totalMatches > 0 ? (stats.games / totalMatches) * 100 : 0;
      const avgKDA =
        stats.deaths > 0
          ? (stats.kills + stats.assists) / stats.deaths
          : stats.kills + stats.assists;

      return { itemId, stats, winRate, pickRate, avgKDA };
    });

    // Normalization bounds (only reliable items)
    const reliable = allStats.filter((s) => s.stats.games >= MIN_GAMES_FOR_SCORE);

    const maxWR = Math.max(...reliable.map((s) => s.winRate), 100);
    const minWR = Math.min(...reliable.map((s) => s.winRate), 0);
    const maxPR = Math.max(...reliable.map((s) => s.pickRate), 100);
    const minPR = Math.min(...reliable.map((s) => s.pickRate), 0);
    const maxKDA = Math.max(...reliable.map((s) => s.avgKDA), 5);
    const minKDA = Math.min(...reliable.map((s) => s.avgKDA), 0);

    const normalize = (value: number, min: number, max: number) => {
      if (max === min) return 50;
      return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    };

    // Upsert all item stats
    let created = 0;
    let updated = 0;
    const now = new Date();

    for (const { itemId, stats, winRate, pickRate, avgKDA } of allStats) {
      let score = 0;
      if (stats.games >= MIN_GAMES_FOR_SCORE) {
        score =
          normalize(winRate, minWR, maxWR) * 0.4 +
          normalize(pickRate, minPR, maxPR) * 0.3 +
          normalize(avgKDA, minKDA, maxKDA) * 0.3;
      }

      const data = {
        totalGames: stats.games,
        totalWins: stats.wins,
        winRate,
        pickRate,
        avgKDA,
        avgKills: stats.games > 0 ? stats.kills / stats.games : 0,
        avgDeaths: stats.games > 0 ? stats.deaths / stats.games : 0,
        avgAssists: stats.games > 0 ? stats.assists / stats.games : 0,
        score,
        lastAnalyzedAt: now,
      };

      const existing = await prisma.itemStats.findUnique({ where: { itemId } });
      if (existing) {
        await prisma.itemStats.update({ where: { itemId }, data });
        updated++;
      } else {
        await prisma.itemStats.create({ data: { itemId, ...data } });
        created++;
      }
    }

    logger.info("Analyse des items terminée", {
      totalItems: statsByItem.size,
      created,
      updated,
      totalParticipants: participants.length,
    });

    return NextResponse.json({
      success: true,
      message: "Analyse des items terminée",
      data: {
        totalItems: statsByItem.size,
        created,
        updated,
        totalParticipants: participants.length,
        totalMatches,
        matchLimit: matchLimit ?? null,
      },
    });
  } catch (error) {
    logger.error(
      "Erreur lors de l'analyse des items",
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de l'analyse des items",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
