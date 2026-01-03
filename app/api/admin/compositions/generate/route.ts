import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import {
  ROLE_PRIORITY,
  resolveChampionRole,
  type CompositionRole,
} from "@/lib/compositions/roles";

type ChampionStatSnapshot = {
  championId: string;
  topRole: string | null;
  topLane: string | null;
  score: number | null;
  winRate: number | null;
  avgKDA: number | null;
  totalGames: number;
};

type EnrichedChampionStat = ChampionStatSnapshot & {
  resolvedRole: CompositionRole;
};

const clampConfidence = (score?: number | null): number =>
  Math.max(0, Math.min(1, (score ?? 0) / 100));

const buildReasoning = (stat: ChampionStatSnapshot): string => {
  const games = stat.totalGames;
  const winRate = stat.winRate ?? 0;
  const kda = stat.avgKDA ?? 0;
  return `Basé sur ${games} parties analysées • ${winRate.toFixed(
    1
  )}% de victoire • KDA moyen ${kda.toFixed(2)}`;
};

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request, { skipCsrf: true });
  if (authError) return authError;

  try {
    const championStats = await prisma.championStats.findMany({
      where: {
        topRole: { not: null },
        totalGames: { gte: 1 },
      },
      orderBy: [{ score: "desc" }],
      select: {
        championId: true,
        topRole: true,
        topLane: true,
        score: true,
        winRate: true,
        avgKDA: true,
        totalGames: true,
      },
    });

    const computeSortableScore = (stat: ChampionStatSnapshot): number =>
      stat.score ?? stat.winRate ?? 0;

    const exploitableStats = championStats.reduce<EnrichedChampionStat[]>(
      (acc, stat) => {
        const resolvedRole = resolveChampionRole(stat.topRole, stat.topLane);
        const qualityScore = computeSortableScore(stat);
        if (!resolvedRole || qualityScore < 0) return acc;
        return [...acc, { ...stat, resolvedRole }];
      },
      []
    );

    if (exploitableStats.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Aucune statistique de champion exploitable. Lancez d'abord l'analyse des champions.",
        },
        { status: 400 }
      );
    }

    const groupedByRole = exploitableStats.reduce<
      Partial<Record<CompositionRole, EnrichedChampionStat[]>>
    >((acc, stat) => {
      const current = acc[stat.resolvedRole] ?? [];
      return { ...acc, [stat.resolvedRole]: [...current, stat] };
    }, {});

    const sortedByRole = Object.fromEntries(
      Object.entries(groupedByRole).map(([role, stats]) => {
        const ordered = [...stats].sort(
          (a, b) => computeSortableScore(b) - computeSortableScore(a)
        );
        return [role, ordered];
      })
    );

    const bestForRole = ROLE_PRIORITY.reduce<
      Record<CompositionRole, string | null>
    >(
      (acc, role) => ({
        ...acc,
        [role]: sortedByRole[role]?.[0]?.championId ?? null,
      }),
      {} as Record<CompositionRole, string | null>
    );

    const suggestions = Object.entries(sortedByRole).flatMap(
      ([role, stats]) => {
        const limited = stats.slice(0, 5);
        return limited.map((stat) => {
          const team = ROLE_PRIORITY.map((slot) =>
            slot === role ? stat.championId : bestForRole[slot]
          ).filter((champ): champ is string => Boolean(champ));

          return {
            userId: null,
            teamChampions: JSON.stringify(team),
            enemyChampions: null,
            role,
            suggestedChampion: stat.championId,
            confidence: clampConfidence(computeSortableScore(stat)),
            reasoning: buildReasoning(stat),
            strengths: null,
            weaknesses: null,
            playstyle: null,
            gameMode: "RANKED_SOLO_5x5",
            tier: null,
          };
        });
      }
    );

    if (suggestions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Impossible de générer des compositions : aucune statistique fiable par rôle.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.compositionSuggestion.deleteMany({
        where: { userId: null },
      }),
      prisma.compositionSuggestion.createMany({
        data: suggestions,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalSuggestions: suggestions.length,
        rolesCovered: Object.keys(sortedByRole).length,
      },
    });
  } catch (error) {
    console.error("[GENERATE-COMPOSITIONS] Erreur:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la génération des compositions",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
