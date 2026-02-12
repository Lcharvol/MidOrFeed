import { NextResponse } from "next/server";
import { REGION_TO_ROUTING, REGION_TO_BASE_URL } from "@/constants/regions";
import { ShardedLeagueAccounts } from "@/lib/prisma-sharded-accounts";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createLogger } from "@/lib/logger";
import { getEnv } from "@/lib/env";
import { cache } from "@/lib/cache";

const logger = createLogger("riot-account-details");

// Rate limiting constants
const RATE_LIMIT_INTERVAL_MS = 150; // ~6-7 rps per routing
const MAX_RETRIES = 3;
const RETRY_BACKOFF_BASE_MS = 1000;

const getAccountDetailsSchema = z.object({
  puuid: z.string().min(1, "PUUID est requis"),
  region: z.string().min(1, "Région est requise"),
  force: z.boolean().optional(),
});

// Base URLs importés depuis constants/regions

export async function POST(request: Request) {
  try {
    // Vérifier que la clé API est configurée
    const RIOT_API_KEY = getEnv().RIOT_API_KEY;
    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Clé API Riot Games non configurée" },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Valider les données
    const validatedData = getAccountDetailsSchema.parse(body);

    // Normaliser et vérifier que la région est valide (accepte EUW1, euw1, etc.)
    const normalizedRegion = validatedData.region.toLowerCase();
    const routing = REGION_TO_ROUTING[normalizedRegion];
    const baseUrl = REGION_TO_BASE_URL[normalizedRegion];

    if (!routing || !baseUrl) {
      return NextResponse.json({ success: false, error: "Région invalide" }, { status: 400 });
    }

    // 1) Si pas force: tenter de retourner le cache DB
    if (!validatedData.force) {
      // Chercher dans la table shardée de la région spécifiée
      const existing = await ShardedLeagueAccounts.findUniqueByPuuid(
        validatedData.puuid,
        normalizedRegion
      );
      // Si pas trouvé, chercher dans toutes les régions (en passant la région connue)
      const existingGlobal = existing
        ? existing
        : await ShardedLeagueAccounts.findUniqueByPuuidGlobal(
            validatedData.puuid,
            normalizedRegion
          );
      if (existingGlobal) {
        return NextResponse.json(
          {
            success: true,
            data: {
              puuid: existingGlobal.puuid,
              gameName: existingGlobal.riotGameName,
              tagLine: existingGlobal.riotTagLine,
              summonerLevel: existingGlobal.summonerLevel,
              profileIconId: existingGlobal.profileIconId,
              summonerId: existingGlobal.riotSummonerId,
              accountId: existingGlobal.riotAccountId,
              revisionDate:
                existingGlobal.revisionDate !== null &&
                existingGlobal.revisionDate !== undefined
                  ? Number(existingGlobal.revisionDate)
                  : null,
            },
            cached: true,
          },
          { status: 200 }
        );
      }
    }

    // 2) Sinon: appel Riot puis mise à jour du cache DB
    // Rate limiter using cache (works across serverless instances)
    const limiterKey = `riot_rate:${routing}`;
    const lastCallTime = cache.get<number>(limiterKey);
    const now = Date.now();
    if (lastCallTime && lastCallTime > now) {
      await new Promise((r) => setTimeout(r, lastCallTime - now));
    }
    cache.set(limiterKey, Date.now() + RATE_LIMIT_INTERVAL_MS, 10); // 10s TTL

    // Fetch with exponential backoff retry
    const fetchWithRetry = async (url: string, retries = MAX_RETRIES): Promise<Response> => {
      const response = await fetch(url, {
        headers: { "X-Riot-Token": RIOT_API_KEY },
      });

      if (response.status === 429 && retries > 0) {
        const retryAfter = parseInt(response.headers.get("Retry-After") || "2", 10);
        const backoff = Math.max(retryAfter * 1000, RETRY_BACKOFF_BASE_MS * (MAX_RETRIES - retries + 1));
        logger.warn(`Rate limited, retrying in ${backoff}ms`, { url, retriesLeft: retries - 1 });
        await new Promise((r) => setTimeout(r, backoff));
        return fetchWithRetry(url, retries - 1);
      }

      return response;
    };

    // Appeler l'API Account pour obtenir le Riot ID
    const encodedPuuid = encodeURIComponent(validatedData.puuid);
    const accountResponse = await fetchWithRetry(
      `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${encodedPuuid}`
    );

    if (!accountResponse.ok) {
      const errorBody = await accountResponse.json().catch(() => ({}));
      logger.warn("Riot Account API error", {
        status: accountResponse.status,
        puuid: validatedData.puuid,
        routing,
        errorBody,
      });

      if (accountResponse.status === 400) {
        const riotMessage = (errorBody as { status?: { message?: string } })?.status?.message ?? "";
        const isDecryptionError = riotMessage.toLowerCase().includes("decrypting");
        return NextResponse.json(
          {
            success: false,
            error: isDecryptionError
              ? "Ce PUUID n'est plus valide côté Riot (clé expirée). Veuillez re-chercher le joueur par son pseudo."
              : "Requête invalide — le PUUID est peut-être corrompu.",
            code: isDecryptionError ? "PUUID_EXPIRED" : "BAD_REQUEST",
          },
          { status: 400 }
        );
      }
      if (accountResponse.status === 404) {
        return NextResponse.json(
          { success: false, error: "Compte non trouvé." },
          { status: 404 }
        );
      }
      if (accountResponse.status === 401) {
        return NextResponse.json(
          { success: false, error: "Clé API Riot invalide ou expirée. Veuillez la mettre à jour." },
          { status: 401 }
        );
      }
      if (accountResponse.status === 403) {
        return NextResponse.json(
          { success: false, error: "Accès refusé. Vérifiez que votre clé API a les bonnes permissions." },
          { status: 403 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: `Erreur API Riot: ${accountResponse.status}`,
          details: errorBody,
        },
        { status: accountResponse.status }
      );
    }

    const accountData = await accountResponse.json();

    // Appeler l'API Summoner pour obtenir plus de détails
    const summonerResponse = await fetch(
      `${baseUrl}/lol/summoner/v4/summoners/by-puuid/${encodedPuuid}`,
      {
        headers: {
          "X-Riot-Token": RIOT_API_KEY,
        },
      }
    );

    let summonerData = null;
    if (summonerResponse.ok) {
      summonerData = await summonerResponse.json();
    } else {
      logger.warn("Summoner API error", {
        status: summonerResponse.status,
        statusText: summonerResponse.statusText,
        puuid: validatedData.puuid,
      });
    }

    // Fetch League v4 pour obtenir le ranked (non-bloquant)
    interface RiotLeagueEntry {
      queueType: string;
      tier: string;
      rank: string;
      leaguePoints: number;
      wins: number;
      losses: number;
    }

    const QUEUE_TYPE_MAP: Record<string, "solo" | "flex"> = {
      RANKED_SOLO_5x5: "solo",
      RANKED_FLEX_SR: "flex",
    };

    let rankedFields: {
      soloTier?: string | null;
      soloRank?: string | null;
      soloLP?: number | null;
      soloWins?: number | null;
      soloLosses?: number | null;
      flexTier?: string | null;
      flexRank?: string | null;
      flexLP?: number | null;
      flexWins?: number | null;
      flexLosses?: number | null;
      rankedUpdatedAt?: Date | null;
    } = {};

    try {
      const leagueResponse = await fetchWithRetry(
        `${baseUrl}/lol/league/v4/entries/by-puuid/${encodedPuuid}`
      );

      if (leagueResponse.ok) {
        const leagueEntries: RiotLeagueEntry[] = await leagueResponse.json();

        for (const entry of leagueEntries) {
          const queue = QUEUE_TYPE_MAP[entry.queueType];
          if (!queue) continue;

          if (queue === "solo") {
            rankedFields.soloTier = entry.tier;
            rankedFields.soloRank = entry.rank;
            rankedFields.soloLP = entry.leaguePoints;
            rankedFields.soloWins = entry.wins;
            rankedFields.soloLosses = entry.losses;
          } else {
            rankedFields.flexTier = entry.tier;
            rankedFields.flexRank = entry.rank;
            rankedFields.flexLP = entry.leaguePoints;
            rankedFields.flexWins = entry.wins;
            rankedFields.flexLosses = entry.losses;
          }

          // Créer un snapshot RankHistory
          try {
            await prisma.rankHistory.create({
              data: {
                puuid: validatedData.puuid,
                region: normalizedRegion,
                queueType: entry.queueType,
                tier: entry.tier,
                rank: entry.rank,
                leaguePoints: entry.leaguePoints,
                wins: entry.wins,
                losses: entry.losses,
              },
            });
          } catch (historyError) {
            logger.warn("Failed to create RankHistory snapshot", {
              puuid: validatedData.puuid,
              queueType: entry.queueType,
              error: historyError instanceof Error ? historyError.message : "Unknown error",
            });
          }
        }

        rankedFields.rankedUpdatedAt = new Date();
      } else {
        logger.warn("League v4 API error (non-blocking)", {
          status: leagueResponse.status,
          puuid: validatedData.puuid,
        });
      }
    } catch (leagueError) {
      logger.warn("Failed to fetch League v4 data (non-blocking)", {
        puuid: validatedData.puuid,
        error: leagueError instanceof Error ? leagueError.message : "Unknown error",
      });
    }

    // Upsert en base pour persister les infos dans la table shardée
    await ShardedLeagueAccounts.upsert({
      puuid: validatedData.puuid,
      riotRegion: normalizedRegion,
      riotGameName: accountData.gameName ?? null,
      riotTagLine: accountData.tagLine ?? null,
      summonerLevel: summonerData?.summonerLevel ?? null,
      profileIconId: summonerData?.profileIconId ?? null,
      riotSummonerId: summonerData?.id ?? null,
      riotAccountId: summonerData?.accountId ?? null,
      revisionDate: summonerData?.revisionDate
        ? BigInt(summonerData.revisionDate)
        : null,
      ...rankedFields,
    });

    // Retourner les données complètes du compte
    return NextResponse.json(
      {
        success: true,
        data: {
          puuid: accountData.puuid,
          gameName: accountData.gameName,
          tagLine: accountData.tagLine,
          summonerLevel: summonerData?.summonerLevel || null,
          profileIconId: summonerData?.profileIconId || null,
          summonerId: summonerData?.id || null,
          accountId: summonerData?.accountId || null,
          revisionDate: summonerData?.revisionDate || null,
        },
        cached: false,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    logger.error("Erreur lors de la récupération des détails", error as Error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des détails" },
      { status: 500 }
    );
  }
}
