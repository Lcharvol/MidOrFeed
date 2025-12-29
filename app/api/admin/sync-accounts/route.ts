import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { ShardedLeagueAccounts } from "@/lib/prisma-sharded-accounts";
import { z } from "zod";

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

// État global du processus de sync (en mémoire)
declare global {
  // eslint-disable-next-line no-var
  var __SYNC_ACCOUNTS_STATE__: SyncAccountsState | undefined;
  // eslint-disable-next-line no-var
  var __RIOT_REGION_LIMITER__: Record<string, LimiterState> | undefined;
}

interface SyncAccountsState {
  isRunning: boolean;
  startedAt: Date | null;
  totalAccounts: number;
  processedAccounts: number;
  accountsCreated: number;
  accountsUpdated: number;
  accountsSkipped: number;
  riotApiCalls: number;
  riotApiErrors: number;
  rateLimitHits: number;
  currentAccount: {
    puuid: string;
    region: string;
    gameName?: string | null;
  } | null;
  lastError: string | null;
  estimatedTimeRemaining: number | null;
  avgTimePerAccount: number;
}

const defaultSyncState: SyncAccountsState = {
  isRunning: false,
  startedAt: null,
  totalAccounts: 0,
  processedAccounts: 0,
  accountsCreated: 0,
  accountsUpdated: 0,
  accountsSkipped: 0,
  riotApiCalls: 0,
  riotApiErrors: 0,
  rateLimitHits: 0,
  currentAccount: null,
  lastError: null,
  estimatedTimeRemaining: null,
  avgTimePerAccount: 0.5,
};

function getSyncState(): SyncAccountsState {
  if (!global.__SYNC_ACCOUNTS_STATE__) {
    global.__SYNC_ACCOUNTS_STATE__ = { ...defaultSyncState };
  }
  return global.__SYNC_ACCOUNTS_STATE__;
}

function updateSyncState(updates: Partial<SyncAccountsState>) {
  const state = getSyncState();
  Object.assign(state, updates);
}

function resetSyncState() {
  global.__SYNC_ACCOUNTS_STATE__ = { ...defaultSyncState };
}

// Limiteur par région
type LimiterState = { nextAt: number };

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
  const jitter = Math.floor(Math.random() * 50);
  limiter.nextAt = Date.now() + minSpacingMs + jitter;
}

const syncOptionsSchema = z.object({
  maxRiotCallsPerCycle: z.number().min(0).optional().default(50),
  batchSize: z.number().min(1).max(100).optional().default(20),
  skipRiotApi: z.boolean().optional().default(false),
});

/**
 * GET /api/admin/sync-accounts
 * Retourne l'état actuel du processus de synchronisation
 */
export async function GET() {
  const state = getSyncState();

  return NextResponse.json({
    success: true,
    data: state,
  });
}

/**
 * POST /api/admin/sync-accounts
 * Convertit tous les participants de matchs en comptes League of Legends
 * et calcule leurs statistiques
 */
export async function POST(request?: Request | NextRequest) {
  // Vérifier les permissions admin (sauf si appelé en interne)
  if (
    request &&
    request instanceof Request &&
    request.url?.includes("internal")
  ) {
    // Appel interne, pas de vérification d'auth
  } else if (request && request instanceof NextRequest) {
    const authError = await requireAdmin(request as NextRequest);
    if (authError) {
      return authError;
    }
  }

  try {
    const state = getSyncState();

    // Vérifier si un processus est déjà en cours
    if (state.isRunning) {
      return NextResponse.json(
        {
          error: "Une synchronisation est déjà en cours",
          data: state,
        },
        { status: 409 }
      );
    }

    // Parser les options
    let options = { maxRiotCallsPerCycle: 50, batchSize: 20, skipRiotApi: false };
    if (request) {
      try {
        const body = await request.json().catch(() => ({}));
        options = syncOptionsSchema.parse(body);
      } catch {
        // Utiliser les valeurs par défaut
      }
    }

    console.log("[SYNC-ACCOUNTS] Démarrage de la synchronisation...");

    // Compter le nombre total de PUUIDs uniques avec une requête optimisée
    // Utiliser une sous-requête COUNT DISTINCT au lieu de charger tous les enregistrements
    const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT "participantPUuid") as count
      FROM "match_participants"
      WHERE "participantPUuid" IS NOT NULL
    `;
    const totalCount = Number(countResult[0]?.count ?? 0);

    if (totalCount === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun compte à synchroniser",
        data: {
          totalPUUIDs: 0,
          accountsCreated: 0,
          accountsUpdated: 0,
        },
      });
    }

    // Initialiser l'état
    updateSyncState({
      isRunning: true,
      startedAt: new Date(),
      totalAccounts: totalCount,
      processedAccounts: 0,
      accountsCreated: 0,
      accountsUpdated: 0,
      accountsSkipped: 0,
      riotApiCalls: 0,
      riotApiErrors: 0,
      rateLimitHits: 0,
      currentAccount: null,
      lastError: null,
      estimatedTimeRemaining: totalCount * state.avgTimePerAccount,
    });

    // Lancer le traitement en arrière-plan
    syncAccountsInBackground(options);

    return NextResponse.json({
      success: true,
      message: `Démarrage de la synchronisation de ${totalCount} comptes`,
      data: getSyncState(),
    });
  } catch (error) {
    console.error("[SYNC-ACCOUNTS] Erreur:", error);
    resetSyncState();
    return NextResponse.json(
      { error: "Erreur lors du démarrage de la synchronisation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/sync-accounts
 * Arrête le processus de synchronisation en cours
 */
export async function DELETE() {
  const state = getSyncState();

  if (!state.isRunning) {
    return NextResponse.json({
      success: true,
      message: "Aucun processus en cours",
    });
  }

  updateSyncState({ isRunning: false });

  return NextResponse.json({
    success: true,
    message: "Processus arrêté",
    data: getSyncState(),
  });
}

// Taille de batch pour la pagination
const BATCH_SIZE = 100;

async function syncAccountsInBackground(options: {
  maxRiotCallsPerCycle: number;
  batchSize: number;
  skipRiotApi: boolean;
}) {
  const processingTimes: number[] = [];
  let riotCalls = 0;
  let lastPuuid: string | null = null;

  try {
    // Traitement par batch avec pagination par curseur
    // Au lieu de charger tous les PUUIDs en mémoire, on les récupère par petits lots
    while (getSyncState().isRunning) {
      // Récupérer un batch de PUUIDs distincts avec pagination par curseur
      let batch: { participantPUuid: string }[];

      if (lastPuuid) {
        batch = await prisma.$queryRaw<{ participantPUuid: string }[]>`
          SELECT DISTINCT "participantPUuid"
          FROM "match_participants"
          WHERE "participantPUuid" IS NOT NULL
            AND "participantPUuid" > ${lastPuuid}
          ORDER BY "participantPUuid"
          LIMIT ${BATCH_SIZE}
        `;
      } else {
        batch = await prisma.$queryRaw<{ participantPUuid: string }[]>`
          SELECT DISTINCT "participantPUuid"
          FROM "match_participants"
          WHERE "participantPUuid" IS NOT NULL
          ORDER BY "participantPUuid"
          LIMIT ${BATCH_SIZE}
        `;
      }

      // Si le batch est vide, on a terminé
      if (batch.length === 0) {
        break;
      }

      // Mémoriser le dernier PUUID pour la pagination
      lastPuuid = batch[batch.length - 1].participantPUuid;

      for (const participant of batch) {
        // Vérifier si le processus a été arrêté
        if (!getSyncState().isRunning) {
          break;
        }

        if (!participant.participantPUuid) continue;

      const startTime = Date.now();

      try {
        // Mettre à jour l'état avec le compte en cours
        updateSyncState({
          currentAccount: {
            puuid: participant.participantPUuid,
            region: "...",
          },
        });

        // Récupérer les statistiques de ce joueur
        const playerStats = await prisma.matchParticipant.aggregate({
          where: { participantPUuid: participant.participantPUuid },
          _count: { id: true },
          _sum: { kills: true, deaths: true, assists: true },
        });

        const totalMatches = playerStats?._count.id || 0;

        if (totalMatches === 0) {
          const currentState = getSyncState();
          updateSyncState({
            processedAccounts: currentState.processedAccounts + 1,
            accountsSkipped: currentState.accountsSkipped + 1,
          });
          continue;
        }

        // Compter les victoires
        const wins = await prisma.matchParticipant.count({
          where: { participantPUuid: participant.participantPUuid, win: true },
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
          where: { participantPUuid: participant.participantPUuid },
          _count: { championId: true },
          orderBy: { _count: { championId: "desc" } },
          take: 1,
        });

        const mostPlayedChampion = championStats[0]?.championId || null;

        // Déterminer la région depuis un match
        const sampleMatch = await prisma.matchParticipant.findFirst({
          where: { participantPUuid: participant.participantPUuid },
          include: { match: true },
        });

        const platformId = sampleMatch?.match.platformId || "UNKNOWN";
        const region = PLATFORM_TO_REGION[platformId] || null;

        // Mettre à jour l'état avec la région
        updateSyncState({
          currentAccount: {
            puuid: participant.participantPUuid,
            region: region || platformId,
          },
        });

        // Récupérer les détails Riot si nécessaire
        let riotDetails = null;
        if (region && !options.skipRiotApi && riotCalls < options.maxRiotCallsPerCycle) {
          const existing = await ShardedLeagueAccounts.findUniqueByPuuid(
            participant.participantPUuid,
            region.toLowerCase()
          );

          const freshEnough =
            existing &&
            Date.now() - new Date(existing.updatedAt).getTime() < 6 * 60 * 60 * 1000;
          const hasBasicProfile =
            existing &&
            (existing.riotGameName || existing.riotTagLine || existing.profileIconId);

          if (!freshEnough || !hasBasicProfile) {
            try {
              await awaitPermit(region, 300);

              const { POST } = await import("@/app/api/riot/get-account-details/route");
              const req = new Request("http://internal/api/riot/get-account-details", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  puuid: participant.participantPUuid,
                  region: region.toLowerCase(),
                }),
              });

              const riotResponse = await POST(req);
              riotCalls++;

              const currentState = getSyncState();
              updateSyncState({ riotApiCalls: currentState.riotApiCalls + 1 });

              if (riotResponse.ok) {
                riotDetails = await riotResponse.json();
              } else if (riotResponse.status === 429) {
                // Rate limit
                const currentState = getSyncState();
                updateSyncState({ rateLimitHits: currentState.rateLimitHits + 1 });

                const retryAfterHeader = riotResponse.headers.get("Retry-After");
                const retryAfter = parseInt(retryAfterHeader || "2", 10);
                const backoffMs = (isNaN(retryAfter) ? 2 : retryAfter) * 1000;

                const limiter = getLimiter(region);
                limiter.nextAt = Date.now() + backoffMs;
                await new Promise((resolve) => setTimeout(resolve, backoffMs));

                // Retry
                await awaitPermit(region, 500);
                const retryResponse = await POST(
                  new Request("http://internal/api/riot/get-account-details", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      puuid: participant.participantPUuid,
                      region: region.toLowerCase(),
                    }),
                  })
                );

                if (retryResponse.ok) {
                  riotDetails = await retryResponse.json();
                }
              } else {
                const currentState = getSyncState();
                updateSyncState({ riotApiErrors: currentState.riotApiErrors + 1 });
              }
            } catch (error) {
              console.error(`[SYNC-ACCOUNTS] Erreur Riot API:`, error);
              const currentState = getSyncState();
              updateSyncState({ riotApiErrors: currentState.riotApiErrors + 1 });
            }
          }
        }

        // Créer ou mettre à jour le compte
        await ShardedLeagueAccounts.upsert({
          puuid: participant.participantPUuid,
          riotRegion: (region || platformId).toLowerCase(),
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
        });

        const currentState = getSyncState();
        updateSyncState({
          accountsCreated: currentState.accountsCreated + 1,
        });
      } catch (error) {
        console.error(
          `[SYNC-ACCOUNTS] Erreur pour ${participant.participantPUuid}:`,
          error
        );
        updateSyncState({
          lastError: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }

      // Mettre à jour les statistiques de temps
      const processingTime = (Date.now() - startTime) / 1000;
      processingTimes.push(processingTime);

      if (processingTimes.length > 20) {
        processingTimes.shift();
      }

      const avgTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
      const currentState = getSyncState();
      const remainingAccounts = currentState.totalAccounts - currentState.processedAccounts - 1;

      updateSyncState({
        processedAccounts: currentState.processedAccounts + 1,
        avgTimePerAccount: avgTime,
        estimatedTimeRemaining: Math.max(0, remainingAccounts * avgTime),
        currentAccount: null,
      });
      }
    }

    console.log(`[SYNC-ACCOUNTS] Synchronisation terminée:`, getSyncState());
  } catch (error) {
    console.error("[SYNC-ACCOUNTS] Erreur globale:", error);
    updateSyncState({
      lastError: error instanceof Error ? error.message : "Erreur globale",
    });
  } finally {
    updateSyncState({
      isRunning: false,
      currentAccount: null,
    });
  }
}
