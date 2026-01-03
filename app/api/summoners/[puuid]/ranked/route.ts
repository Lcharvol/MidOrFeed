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
import { fetchOpggApi } from "@/lib/opgg-scraper";
import type { RankedResponse, ApiResponse } from "@/types/api";

const getRiotApiKey = (): string | null => {
  const env = getEnv();
  return env.RIOT_API_KEY || null;
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

  const rankedLogger = createLogger("ranked");
  let puuid = "";

  try {
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

    // Vérifier si on a une clé API Riot
    const RIOT_API_KEY = getRiotApiKey();

    // Récupérer le compte depuis la base de données
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

    // Si pas de clé API Riot, utiliser OP.GG comme fallback
    if (!RIOT_API_KEY) {
      rankedLogger.info("Pas de RIOT_API_KEY, utilisation de OP.GG", { puuid });

      // On a besoin du gameName et tagLine pour OP.GG
      if (!account?.riotGameName || !account?.riotTagLine) {
        return NextResponse.json(
          {
            success: true,
            data: {
              solo: null,
              flex: null,
            },
            source: "no_data",
          },
          { status: 200 }
        );
      }

      const opggData = await fetchOpggApi(
        account.riotGameName,
        account.riotTagLine,
        normalizedRegion
      );

      if (!opggData) {
        return NextResponse.json(
          {
            success: true,
            data: {
              solo: null,
              flex: null,
            },
            source: "opgg_error",
          },
          { status: 200 }
        );
      }

      // Transformer les données OP.GG au format attendu
      const response: RankedResponse = {
        success: true,
        data: {
          solo: opggData.solo ? {
            current: {
              tier: opggData.solo.tier,
              rank: opggData.solo.rank,
              lp: opggData.solo.lp,
              wins: opggData.solo.wins,
              losses: opggData.solo.losses,
              winRate: opggData.solo.winRate,
            },
            best: {
              tier: opggData.solo.tier,
              rank: opggData.solo.rank,
              lp: opggData.solo.lp,
            },
            seasonHistory: [],
          } : null,
          flex: opggData.flex ? {
            current: {
              tier: opggData.flex.tier,
              rank: opggData.flex.rank,
              lp: opggData.flex.lp,
              wins: opggData.flex.wins,
              losses: opggData.flex.losses,
              winRate: opggData.flex.winRate,
            },
            best: {
              tier: opggData.flex.tier,
              rank: opggData.flex.rank,
              lp: opggData.flex.lp,
            },
            seasonHistory: [],
          } : null,
        },
      };

      return NextResponse.json({ ...response, source: "opgg" }, { status: 200 });
    }

    // === Utiliser l'API Riot (comportement existant) ===
    let summonerId = account?.riotSummonerId;

    // Si pas de summonerId en DB, récupérer via l'API Riot
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
            cacheTTL: CacheTTL.MEDIUM,
          }),
        { region: normalizedRegion }
      );

      const summonerData = summonerResponseData.data;
      summonerId = summonerData.id;

      // Mettre à jour la DB avec le summonerId
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

    // Récupérer les données de ranked via l'API League
    const leagueResponseData = await measureTiming(
      "api.riot.league.bySummoner",
      () =>
        riotApiRequest<RiotLeagueEntry[]>(
          `${baseUrl}/lol/league/v4/entries/by-summoner/${summonerId}`,
          {
            region: normalizedRegion,
            cacheKey: `riot:league:${summonerId}:${normalizedRegion}`,
            cacheTTL: CacheTTL.MEDIUM,
          }
        ).catch((error) => {
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

    return NextResponse.json({ ...response, source: "riot" }, { status: 200 });
  } catch (error) {
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
