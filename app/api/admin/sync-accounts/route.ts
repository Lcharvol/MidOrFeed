import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Mapping des platformId vers les regions
const PLATFORM_TO_REGION: Record<string, string> = {
  EUW1: "euw1",
  EUN1: "eun1",
  TR1: "tr1",
  RU: "ru",
  NA1: "na1",
  LA1: "la1",
  LA2: "la2",
  BR1: "br1",
  KR: "kr",
  JP1: "jp1",
  OC1: "oc1",
  PH2: "ph2",
  SG2: "sg2",
  TH2: "th2",
  TW2: "tw2",
  VN2: "vn2",
};

// Limiteur global par région (token spacing + backoff sur 429)
type LimiterState = { nextAt: number };
declare global {
  var __RIOT_REGION_LIMITER__: Record<string, LimiterState> | undefined;
}
function getLimiter(region: string) {
  if (!global.__RIOT_REGION_LIMITER__) global.__RIOT_REGION_LIMITER__ = {};
  const key = region.toLowerCase();
  if (!global.__RIOT_REGION_LIMITER__[key]) {
    global.__RIOT_REGION_LIMITER__[key] = { nextAt: 0 };
  }
  return global.__RIOT_REGION_LIMITER__[key];
}
async function awaitPermit(region: string, minSpacingMs = 250) {
  const limiter = getLimiter(region);
  const now = Date.now();
  if (limiter.nextAt > now) {
    await new Promise((r) => setTimeout(r, limiter.nextAt - now));
  }
  // léger jitter pour désynchroniser
  const jitter = Math.floor(Math.random() * 50);
  limiter.nextAt = Date.now() + minSpacingMs + jitter;
}

/**
 * POST /api/admin/sync-accounts
 * Convertit tous les participants de matchs en comptes League of Legends
 * et calcule leurs statistiques
 */
export async function POST(request?: Request) {
  try {
    console.log("[SYNC-ACCOUNTS] Démarrage de la synchronisation...");
    // Paramètres optionnels
    let maxRiotCallsPerCycle = Number.POSITIVE_INFINITY;
    if (request) {
      try {
        const body = await request.json().catch(() => ({}));
        if (typeof body?.maxRiotCallsPerCycle === "number") {
          maxRiotCallsPerCycle = Math.max(0, body.maxRiotCallsPerCycle | 0);
        }
      } catch {}
    }

    // 1. Récupérer tous les PUUID uniques des participants
    const participants = await prisma.matchParticipant.findMany({
      select: {
        participantPUuid: true,
      },
      distinct: ["participantPUuid"],
      where: {
        participantPUuid: { not: null },
      },
    });

    console.log(`[SYNC-ACCOUNTS] ${participants.length} PUUID uniques trouvés`);

    let accountsCreated = 0;
    const accountsUpdated = 0;

    // 2. Pour chaque PUUID, créer ou mettre à jour le compte
    let riotCalls = 0;
    for (const participant of participants) {
      if (!participant.participantPUuid) continue;

      try {
        // Récupérer les statistiques de ce joueur
        const playerStats = await prisma.matchParticipant.aggregate({
          where: {
            participantPUuid: participant.participantPUuid,
          },
          _count: { id: true },
          _sum: {
            kills: true,
            deaths: true,
            assists: true,
          },
        });

        const totalMatches = playerStats?._count.id || 0;

        if (totalMatches === 0) continue;

        // Compter les victoires
        const wins = await prisma.matchParticipant.count({
          where: {
            participantPUuid: participant.participantPUuid,
            win: true,
          },
        });

        const losses = totalMatches - wins;
        const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

        // Calculer le KDA moyen
        const totalKills = playerStats?._sum.kills || 0;
        const totalDeaths = playerStats?._sum.deaths || 0;
        const totalAssists = playerStats?._sum.assists || 0;
        const avgKDA =
          totalDeaths > 0
            ? (totalKills + totalAssists) / totalDeaths
            : totalKills + totalAssists;

        // Trouver le champion le plus joué
        const championStats = await prisma.matchParticipant.groupBy({
          by: ["championId"],
          where: {
            participantPUuid: participant.participantPUuid,
          },
          _count: { championId: true },
          orderBy: {
            _count: {
              championId: "desc",
            },
          },
          take: 1,
        });

        const mostPlayedChampion = championStats[0]?.championId || null;

        // Essayer de récupérer les détails du compte depuis un Match
        // pour déterminer la région
        const sampleMatch = await prisma.matchParticipant.findFirst({
          where: {
            participantPUuid: participant.participantPUuid,
          },
          include: {
            match: true,
          },
        });

        const platformId = sampleMatch?.match.platformId || "UNKNOWN";
        const region = PLATFORM_TO_REGION[platformId] || null;

        // Récupérer les détails du compte Riot depuis l'API UNIQUEMENT si les données sont manquantes ou anciennes
        let riotDetails = null;
        if (region) {
          const existing = await prisma.leagueOfLegendsAccount.findUnique({
            where: { puuid: participant.participantPUuid },
            select: {
              updatedAt: true,
              riotGameName: true,
              riotTagLine: true,
              profileIconId: true,
            },
          });
          const freshEnough =
            existing &&
            Date.now() - new Date(existing.updatedAt).getTime() <
              6 * 60 * 60 * 1000; // < 6h
          const hasBasicProfile =
            existing &&
            (existing.riotGameName ||
              existing.riotTagLine ||
              existing.profileIconId);
          if (freshEnough && hasBasicProfile) {
            // éviter l'appel Riot si déjà frais
          } else {
            // quota atteint ? on saute l'appel Riot pour ce participant
            if (riotCalls >= maxRiotCallsPerCycle) {
              // Pas d'appel riotDetails, on se contente des stats locales
            } else {
              try {
                await awaitPermit(region, 300);
                // Appeler l'endpoint interne directement (évite les problèmes d'URL/port)
                const { POST } = await import(
                  "@/app/api/riot/get-account-details/route"
                );
                const req = new Request(
                  "http://internal/api/riot/get-account-details",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      puuid: participant.participantPUuid,
                      region: region.toLowerCase(),
                    }),
                  }
                );
                const riotResponse = await POST(req);
                riotCalls++;

                if (riotResponse.ok) {
                  riotDetails = await riotResponse.json();
                  console.log(
                    `[SYNC-ACCOUNTS] Données Riot récupérées pour ${participant.participantPUuid}:`,
                    riotDetails
                  );
                } else if (riotResponse.status === 429) {
                  // Rate limit exceeded - attendre avant de continuer
                  console.warn(
                    "[SYNC-ACCOUNTS] Rate limit atteint, attente..."
                  );
                  const retryAfterHeader =
                    riotResponse.headers.get("Retry-After");
                  const retryAfter = parseInt(retryAfterHeader || "2", 10);
                  const backoffMs = (isNaN(retryAfter) ? 2 : retryAfter) * 1000;
                  // positionner le prochain slot après backoff
                  const limiter = getLimiter(region);
                  limiter.nextAt = Date.now() + backoffMs;
                  await new Promise((resolve) =>
                    setTimeout(resolve, backoffMs)
                  );

                  // Retry once
                  await awaitPermit(region, 500);
                  const retryReq = new Request(
                    "http://internal/api/riot/get-account-details",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        puuid: participant.participantPUuid,
                        region: region.toLowerCase(),
                      }),
                    }
                  );
                  const retryResponse = await POST(retryReq);

                  if (retryResponse.ok) {
                    riotDetails = await retryResponse.json();
                  }
                } else {
                  console.error(
                    `[SYNC-ACCOUNTS] Erreur Riot API pour ${participant.participantPUuid}:`,
                    riotResponse.status
                  );
                }

                // Délai entre les requêtes pour éviter les rate limits
                await awaitPermit(region, 300);
              } catch (error) {
                console.error(
                  `[SYNC-ACCOUNTS] Erreur Riot API pour ${participant.participantPUuid}:`,
                  error
                );
              }
            }
          }
        }

        // Créer ou mettre à jour le compte
        const account = await prisma.leagueOfLegendsAccount.upsert({
          where: { puuid: participant.participantPUuid },
          create: {
            puuid: participant.participantPUuid,
            riotRegion: region || platformId,
            riotGameName: riotDetails?.data?.gameName || null,
            riotTagLine: riotDetails?.data?.tagLine || null,
            riotSummonerId: riotDetails?.data?.summonerId || null,
            riotAccountId: riotDetails?.data?.accountId || null,
            summonerLevel: riotDetails?.data?.summonerLevel || null,
            profileIconId: riotDetails?.data?.profileIconId || null,
            revisionDate: riotDetails?.data?.revisionDate
              ? BigInt(riotDetails.data.revisionDate)
              : null,
            totalMatches,
            totalWins: wins,
            totalLosses: losses,
            winRate,
            avgKDA,
            mostPlayedChampion,
          },
          update: {
            // n'écrase que si on a récupéré des données Riot
            riotGameName: riotDetails?.data?.gameName ?? undefined,
            riotTagLine: riotDetails?.data?.tagLine ?? undefined,
            riotSummonerId: riotDetails?.data?.summonerId ?? undefined,
            riotAccountId: riotDetails?.data?.accountId ?? undefined,
            summonerLevel: riotDetails?.data?.summonerLevel ?? undefined,
            profileIconId: riotDetails?.data?.profileIconId ?? undefined,
            revisionDate: riotDetails?.data?.revisionDate
              ? BigInt(riotDetails.data.revisionDate)
              : undefined,
            totalMatches,
            totalWins: wins,
            totalLosses: losses,
            winRate,
            avgKDA,
            mostPlayedChampion,
          },
        });

        accountsCreated++;
      } catch (error) {
        console.error(
          `[SYNC-ACCOUNTS] Erreur pour PUUID ${participant.participantPUuid}:`,
          error
        );
      }
    }

    console.log(`[SYNC-ACCOUNTS] ${accountsCreated} comptes synchronisés`);

    return NextResponse.json(
      {
        success: true,
        message: "Synchronisation terminée",
        data: {
          totalPUUIDs: participants.length,
          accountsCreated,
          accountsUpdated,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[SYNC-ACCOUNTS] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation" },
      { status: 500 }
    );
  }
}
