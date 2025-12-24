import { NextRequest, NextResponse } from "next/server";
import { REGION_TO_BASE_URL } from "@/constants/regions";
import { ShardedLeagueAccounts } from "@/lib/prisma-sharded-accounts";
import { getEnv } from "@/lib/env";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { prismaWithTimeout } from "@/lib/timeout";
import { measureTiming } from "@/lib/metrics";
import { riotApiRequest } from "@/lib/riot-api";
import { CacheTTL } from "@/lib/cache";
import { createLogger } from "@/lib/logger";
import type { RankedResponse, ApiResponse } from "@/types/api";

const getRiotApiKey = (): string => {
  const env = getEnv();
  const key = env.RIOT_API_KEY;
  if (!key) {
    throw new Error("RIOT_API_KEY est requis pour cette fonctionnalité");
  }
  return key;
};

type Params = {
  puuid: string;
};

interface RiotLeagueEntry {
  leagueId: string;
  queueType: string;
  tier: string;
  rank: string;
  summonerId: string;
  summonerName: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
}

const QUEUE_TYPE_MAP: Record<string, "solo" | "flex" | "other"> = {
  RANKED_SOLO_5x5: "solo",
  RANKED_FLEX_SR: "flex",
};

const getCurrentSeason = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  // Saison 1: janvier-mars (1-3), Saison 2: avril-juin (4-6), etc.
  const season = Math.floor((month - 1) / 3) + 1;
  return `S${year} S${season}`;
};

const transformLeagueData = (
  leagueEntries: RiotLeagueEntry[],
  queueType: "solo" | "flex"
) => {
  const entry = leagueEntries.find((e) => {
    const mappedQueue = QUEUE_TYPE_MAP[e.queueType];
    return mappedQueue === queueType;
  });

  if (!entry) {
    return null;
  }

  const totalGames = entry.wins + entry.losses;
  const winRate = totalGames === 0 ? 0 : (entry.wins / totalGames) * 100;

  return {
    current: {
      tier: entry.tier,
      rank: entry.rank,
      lp: entry.leaguePoints,
      wins: entry.wins,
      losses: entry.losses,
      winRate: Math.round(winRate * 10) / 10,
    },
    // Pour l'instant, on utilise les mêmes données pour "best"
    // On pourrait améliorer ça en cherchant dans l'historique
    best: {
      tier: entry.tier,
      rank: entry.rank,
      lp: entry.leaguePoints,
    },
    // Pour l'instant, on retourne un historique vide car l'API Riot League v4
    // ne fournit pas l'historique des saisons précédentes
    seasonHistory: [] as Array<{
      season: string;
      tier: string;
      rank: string;
      lp: number;
    }>,
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  // Rate limiting modéré pour les API publiques
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let puuid = "";
  try {
    // Vérifier que la clé API est disponible
    const RIOT_API_KEY = getRiotApiKey();
    const env = getEnv();

    const resolvedParams = await params;
    puuid = resolvedParams.puuid || "";

    if (!puuid) {
      return NextResponse.json({ error: "PUUID requis" }, { status: 400 });
    }

    // Récupérer la région depuis les query params
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get("region");

    if (!region) {
      return NextResponse.json({ error: "Région requise" }, { status: 400 });
    }

    // Normaliser la région
    const normalizedRegion = region.toLowerCase();
    const baseUrl = REGION_TO_BASE_URL[normalizedRegion];

    if (!baseUrl) {
      return NextResponse.json({ error: "Région invalide" }, { status: 400 });
    }

    // Récupérer le summonerId depuis la base de données (tables shardées) avec timeout et métriques
    // Passer la région connue pour éviter la recherche globale
    const account = await measureTiming(
      "api.summoners.ranked.findAccount",
      () =>
        prismaWithTimeout(
          () =>
            ShardedLeagueAccounts.findUniqueByPuuidGlobal(
              puuid,
              normalizedRegion
            ),
          10000 // 10 secondes
        ),
      { puuid, region: normalizedRegion }
    );

    let summonerId = account?.riotSummonerId;

    // Si pas de summonerId en DB, récupérer via l'API Riot avec retry, cache et timeout
    if (!summonerId) {
      const summonerResponseData = await measureTiming(
        "api.riot.summoner.byPuuid",
        () =>
          riotApiRequest<{
            id: string;
            accountId: string;
            puuid: string;
            name: string;
            profileIconId: number;
            revisionDate: number;
            summonerLevel: number;
          }>(`${baseUrl}/lol/summoner/v4/summoners/by-puuid/${puuid}`, {
            region: normalizedRegion,
            cacheKey: `riot:summoner:${puuid}:${normalizedRegion}`,
            cacheTTL: CacheTTL.MEDIUM, // 5 minutes
          }),
        { region: normalizedRegion }
      );

      // La réponse est déjà parsée, utiliser directement les données
      const summonerData = summonerResponseData.data;
      summonerId = summonerData.id;

      // Mettre à jour la DB avec le summonerId dans la table shardée
      if (account && account.riotRegion) {
        await ShardedLeagueAccounts.upsert({
          puuid: puuid,
          riotRegion: account.riotRegion,
          riotSummonerId: summonerId,
        });
      }
    }

    if (!summonerId) {
      return NextResponse.json(
        {
          success: true,
          data: {
            solo: null,
            flex: null,
          },
        },
        { status: 200 }
      );
    }

    // Récupérer les données de ranked via l'API League avec retry, cache et timeout
    const leagueResponseData = await measureTiming(
      "api.riot.league.bySummoner",
      () =>
        riotApiRequest<RiotLeagueEntry[]>(
          `${baseUrl}/lol/league/v4/entries/by-summoner/${summonerId}`,
          {
            region: normalizedRegion,
            cacheKey: `riot:league:${summonerId}:${normalizedRegion}`,
            cacheTTL: CacheTTL.MEDIUM, // 5 minutes
          }
        ).catch((error) => {
          // Si 404, retourner un tableau vide (pas de classement)
          if (error.message.includes("404")) {
            return { data: [] as RiotLeagueEntry[], cached: false, attempt: 1 };
          }
          throw error;
        }),
      { region: normalizedRegion }
    );

    const leagueEntries = leagueResponseData.data;

    // Transformer les données pour chaque queue type
    const soloData = transformLeagueData(leagueEntries, "solo");
    const flexData = transformLeagueData(leagueEntries, "flex");

    const response: RankedResponse = {
      success: true,
      data: {
        solo: soloData,
        flex: flexData,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const rankedLogger = createLogger("ranked");
    rankedLogger.error("Erreur lors de la récupération du classement", error as Error, {
      puuid,
    });
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération du classement",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
