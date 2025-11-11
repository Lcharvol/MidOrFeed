import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const latestRun = await prisma.mlTrainingRun.findFirst({
      orderBy: { startedAt: "desc" },
      select: { id: true, status: true, finishedAt: true },
    });

    if (!latestRun) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucun entraînement ML n'a encore été exécuté.",
        },
        { status: 404 }
      );
    }

    const [champions, matches] = await Promise.all([
      prisma.mlPrediction.findMany({
        where: {
          trainingRunId: latestRun.id,
          sampleCount: { not: null },
        },
        orderBy: [{ sampleCount: "desc" }],
        take: 50,
        select: {
          championId: true,
          winProbability: true,
          sampleCount: true,
        },
      }),
      prisma.mlPrediction.findMany({
        where: {
          trainingRunId: latestRun.id,
          matchId: { not: null },
        },
        orderBy: [{ winProbability: "desc" }],
        take: 100,
        select: {
          matchId: true,
          participantPUuid: true,
          championId: true,
          winProbability: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        run: latestRun,
        byChampion: champions,
        byMatch: matches,
      },
    });
  } catch (error) {
    console.error("Erreur lecture prédictions ML", error);
    return NextResponse.json(
      {
        success: false,
        error: "Impossible de lire les prédictions ML",
      },
      { status: 500 }
    );
  }
}
