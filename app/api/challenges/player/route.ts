import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const puuid = url.searchParams.get("puuid");
  const leagueAccountId = url.searchParams.get("leagueAccountId");

  if (!puuid && !leagueAccountId) {
    return NextResponse.json(
      { success: false, error: "Paramètre puuid ou leagueAccountId requis" },
      { status: 400 }
    );
  }

  const account = await prisma.leagueOfLegendsAccount.findFirst({
    where: puuid ? { puuid } : { id: leagueAccountId ?? "" },
    select: {
      id: true,
      puuid: true,
      riotGameName: true,
      riotTagLine: true,
      riotRegion: true,
      playerChallenges: {
        select: {
          id: true,
          challengeId: true,
          currentValue: true,
          currentLevel: true,
          highestLevel: true,
          percentile: true,
          achievedTime: true,
          nextLevelValue: true,
          progress: true,
          pointsEarned: true,
          updatedAt: true,
          challenge: {
            select: {
              challengeId: true,
              name: true,
              shortDescription: true,
              description: true,
              category: true,
              level: true,
              thresholds: true,
              tags: true,
              maxValue: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!account) {
    return NextResponse.json(
      { success: false, error: "Compte introuvable" },
      { status: 404 }
    );
  }

  const challenges = account.playerChallenges.map((entry) => ({
    id: entry.id,
    challengeId: entry.challengeId,
    name: entry.challenge?.name ?? `Challenge ${entry.challengeId}`,
    description:
      entry.challenge?.description ?? entry.challenge?.shortDescription,
    category: entry.challenge?.category ?? "Inconnu",
    level: entry.currentLevel,
    highestLevel: entry.highestLevel,
    percentile: entry.percentile,
    currentValue: entry.currentValue,
    nextLevelValue: entry.nextLevelValue,
    progress: entry.progress,
    pointsEarned: entry.pointsEarned,
    thresholds: entry.challenge?.thresholds,
    tags: entry.challenge?.tags,
    maxValue: entry.challenge?.maxValue,
    updatedAt: entry.updatedAt,
    achievedTime: entry.achievedTime,
  }));

  const challengePoints = challenges.reduce((sum, challenge) => {
    return sum + (challenge.pointsEarned ?? 0);
  }, 0);

  return NextResponse.json({
    success: true,
    data: {
      account: {
        id: account.id,
        puuid: account.puuid,
        riotGameName: account.riotGameName,
        riotTagLine: account.riotTagLine,
        riotRegion: account.riotRegion,
      },
      challenges,
      count: challenges.length,
      totalPoints: {
        challengePoints,
      },
    },
  });
}
