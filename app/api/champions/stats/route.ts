import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Calculer la tendance du win rate en comparant avec l'historique récent (7 jours)
const calculateWinRateTrend = (
  currentWinRate: number,
  previousWinRate: number | null
): { trend: "up" | "down" | "stable"; change: number } | null => {
  if (previousWinRate === null) return null;

  const change = currentWinRate - previousWinRate;
  const threshold = 0.5; // Seuil de 0.5% pour considérer une tendance

  if (Math.abs(change) < threshold) {
    return { trend: "stable", change: 0 };
  }

  return {
    trend: change > 0 ? "up" : "down",
    change: Math.abs(change),
  };
};

export async function GET() {
  try {
    const stats = await prisma.championStats.findMany({
      orderBy: [{ score: "desc" }, { totalGames: "desc" }],
    });

    // Compter le nombre total de matchs uniques dans la base de données
    // Compter tous les matchs qui ont été analysés (qui ont des participants)
    const totalUniqueMatches = await prisma.match.count({
      where: {
        participants: {
          some: {},
        },
      },
    });

    if (stats.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          count: 0,
          totalUniqueMatches,
        },
        { status: 200 }
      );
    }

    const championIds = stats.map((stat) => stat.championId);

    // Pour chaque champion, récupérer le deuxième enregistrement le plus récent
    // Le premier est probablement l'actuel, donc on prend le deuxième pour la comparaison
    const historyMap = new Map<string, number>();

    // Récupérer tous les historiques triés par champion et date (desc)
    const allHistory = await prisma.championWinRateHistory.findMany({
      where: {
        championId: { in: championIds },
      },
      orderBy: [
        { championId: "asc" },
        { recordedAt: "desc" },
      ],
    });

    // Pour chaque champion, prendre le deuxième enregistrement le plus récent
    // (le premier est probablement l'enregistrement de la dernière analyse)
    let currentChampionId: string | null = null;
    let recordCount = 0;
    
    for (const record of allHistory) {
      if (currentChampionId !== record.championId) {
        // Nouveau champion, réinitialiser le compteur
        currentChampionId = record.championId;
        recordCount = 1;
      } else {
        recordCount++;
      }

      // Prendre le deuxième enregistrement (recordCount === 2)
      if (recordCount === 2 && !historyMap.has(record.championId)) {
        historyMap.set(record.championId, record.winRate);
      }
    }

    // Calculer la tendance pour chaque champion
    const statsWithTrend = stats.map((stat) => {
      const previousWinRate = historyMap.get(stat.championId) ?? null;
      const trend = calculateWinRateTrend(stat.winRate, previousWinRate);

      return {
        ...stat,
        winRateTrend: trend,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: statsWithTrend,
        count: stats.length,
        totalUniqueMatches,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des statistiques",
      },
      { status: 500 }
    );
  }
}
