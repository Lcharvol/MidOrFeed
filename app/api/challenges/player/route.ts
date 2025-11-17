import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShardedLeagueAccounts } from "@/lib/prisma-sharded-accounts";

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

  // Note: playerChallenges nécessite une relation avec leagueAccountId
  // On doit d'abord trouver le compte, puis récupérer les challenges
  let accountId: string | null = null;
  
  if (puuid) {
    const account = await ShardedLeagueAccounts.findUniqueByPuuidGlobal(puuid);
    if (account) {
      accountId = account.id;
    }
  } else if (leagueAccountId) {
    accountId = leagueAccountId;
  }

  if (!accountId) {
    return NextResponse.json(
      { success: false, error: "Compte introuvable" },
      { status: 404 }
    );
  }

  // Récupérer les challenges depuis la table PlayerChallenge
  const playerChallenges = await prisma.playerChallenge.findMany({
    where: { leagueAccountId: accountId },
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
  });

  // Récupérer les infos du compte
  let account = null;
  if (puuid) {
    account = await ShardedLeagueAccounts.findUniqueByPuuidGlobal(puuid);
  } else if (leagueAccountId) {
    // Si on a seulement l'ID, on doit chercher dans toutes les régions
    // Note: Ce n'est pas optimal, mais nécessaire pour maintenir la compatibilité
    const allRegions = ["euw1", "eun1", "na1", "br1", "kr", "jp1", "ru", "tr1"];
    for (const region of allRegions) {
      // On ne peut pas chercher par ID directement avec les tables shardées
      // On doit utiliser une autre approche
    }
    // Pour l'instant, on retourne une erreur si seul l'ID est fourni
    return NextResponse.json(
      { success: false, error: "Recherche par ID uniquement non supportée pour les tables shardées" },
      { status: 400 }
    );
  }

  if (!account) {
    return NextResponse.json(
      { success: false, error: "Compte introuvable" },
      { status: 404 }
    );
  }

  const challenges = playerChallenges.map((entry) => ({
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
