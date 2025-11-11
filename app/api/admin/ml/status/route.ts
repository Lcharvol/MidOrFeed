import { NextResponse } from "next/server";
import { stat } from "fs/promises";
import { resolve } from "path";
import { prisma } from "@/lib/prisma";

const DATA_FILE = resolve(process.cwd(), "ml/data/match_participants.csv");

const safeStat = async (path: string) => {
  try {
    const info = await stat(path);
    return {
      exists: true,
      size: info.size,
      updatedAt: info.mtime.toISOString(),
      path,
    };
  } catch {
    return { exists: false, path };
  }
};

export async function GET() {
  const [dataset, runs] = await Promise.all([
    safeStat(DATA_FILE),
    prisma.mlTrainingRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 5,
      select: {
        id: true,
        startedAt: true,
        finishedAt: true,
        status: true,
        message: true,
      },
    }),
  ]);

  const latestRun = runs.length
    ? await prisma.mlTrainingRun.findUnique({
        where: { id: runs[0].id },
        select: { id: true },
      })
    : null;

  let championSummary = [] as {
    championId: string;
    winProbability: number;
    sampleCount: number;
  }[];
  let matchSamples = [] as {
    matchId: string | null;
    participantPUuid: string | null;
    championId: string;
    winProbability: number;
  }[];

  if (latestRun) {
    const [champions, matches] = await Promise.all([
      prisma.mlPrediction.findMany({
        where: {
          trainingRunId: latestRun.id,
          sampleCount: { not: null },
        },
        orderBy: [{ sampleCount: "desc" }],
        take: 20,
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
        take: 20,
        select: {
          matchId: true,
          participantPUuid: true,
          championId: true,
          winProbability: true,
        },
      }),
    ]);

    championSummary = champions.map((entry) => ({
      championId: entry.championId,
      winProbability: entry.winProbability,
      sampleCount: entry.sampleCount ?? 0,
    }));

    matchSamples = matches.map((entry) => ({
      matchId: entry.matchId,
      participantPUuid: entry.participantPUuid,
      championId: entry.championId,
      winProbability: entry.winProbability,
    }));
  }

  return NextResponse.json({
    success: true,
    data: {
      dataset,
      runs,
      championSummary,
      matchSamples,
    },
  });
}
