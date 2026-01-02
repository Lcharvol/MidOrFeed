import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MATCHES_PAGE_LIMIT } from "@/constants/matches";
import { resolveChampionRole } from "@/lib/compositions/roles";

export type CounterPickMode = "same_lane" | "global";

type CounterPickFilters = {
  region?: string | null;
  queueId?: number | null;
  mode: CounterPickMode;
};

const parseFilters = (request: Request): CounterPickFilters => {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region");
  const queueIdParam = searchParams.get("queueId");
  const queueId = queueIdParam ? Number(queueIdParam) : null;
  const modeParam = searchParams.get("mode");
  const mode: CounterPickMode = modeParam === "global" ? "global" : "same_lane";
  return {
    region: region ?? null,
    queueId: Number.isFinite(queueId) ? queueId : null,
    mode,
  };
};

const normalizeChampionId = (championId: string | null | undefined) =>
  championId?.trim() ?? null;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const championId = normalizeChampionId(searchParams.get("championId"));

  if (!championId) {
    return NextResponse.json(
      {
        success: false,
        error: "championId requis",
      },
      { status: 400 }
    );
  }

  const { region, queueId, mode } = parseFilters(request);

  try {
    const matchFilter = {
      participants: {
        some: {
          championId,
          ...(region ? { match: { region } } : {}),
          ...(queueId ? { match: { queueId } } : {}),
        },
      },
    };

    const matches = await prisma.match.findMany({
      where: matchFilter,
      include: {
        participants: true,
      },
      orderBy: {
        gameCreation: "desc",
      },
      take: MATCHES_PAGE_LIMIT * 2,
    });

    if (matches.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          championId,
          mode,
          pairs: [],
          totalMatches: 0,
        },
      });
    }

    const counterStats = new Map<
      string,
      {
        wins: number;
        losses: number;
        total: number;
        lastPlayed: number;
      }
    >();

    matches.forEach((match) => {
      const targetParticipant = match.participants.find(
        (participant) => participant.championId === championId
      );
      if (!targetParticipant) return;

      const enemyTeamId = targetParticipant.teamId === 100 ? 200 : 100;

      // En mode global, on prend tous les ennemis
      // En mode same_lane, on filtre par même rôle
      const enemyParticipants = match.participants.filter((participant) => {
        if (participant.teamId !== enemyTeamId) return false;

        if (mode === "global") return true;

        // Mode same_lane: filtrer par rôle
        const targetRole = resolveChampionRole(
          targetParticipant.role,
          targetParticipant.lane
        );
        if (!targetRole) return true;
        const enemyRole = resolveChampionRole(
          participant.role,
          participant.lane
        );
        return enemyRole === targetRole;
      });

      enemyParticipants.forEach((enemy) => {
        const current = counterStats.get(enemy.championId) ?? {
          wins: 0,
          losses: 0,
          total: 0,
          lastPlayed: 0,
        };

        const enemyWon = enemy.win ?? false;
        const updated = {
          wins: current.wins + (enemyWon ? 1 : 0),
          losses: current.losses + (enemyWon ? 0 : 1),
          total: current.total + 1,
          lastPlayed:
            Number(match.gameCreation) > current.lastPlayed
              ? Number(match.gameCreation)
              : current.lastPlayed,
        };

        counterStats.set(enemy.championId, updated);
      });
    });

    const pairs = Array.from(counterStats.entries())
      .filter(([, stats]) => stats.total >= 5)
      .map(([enemyChampionId, stats]) => ({
        enemyChampionId,
        games: stats.total,
        wins: stats.wins,
        losses: stats.losses,
        winRate: stats.total > 0 ? stats.wins / stats.total : 0,
        lastPlayedAt: stats.lastPlayed.toString(),
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 20);

    return NextResponse.json({
      success: true,
      data: {
        championId,
        mode,
        totalMatches: matches.length,
        pairs,
      },
    });
  } catch (error) {
    console.error("[COUNTER-PICKS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Impossible de calculer les couter picks",
      },
      { status: 500 }
    );
  }
}
