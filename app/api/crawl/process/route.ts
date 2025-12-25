import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MATCHES_FETCH_LIMIT } from "@/constants/matches";
import { z } from "zod";

type CollectResult = {
  matchesCollected?: number;
  [key: string]: unknown;
};

// Clé API Riot Games depuis les variables d'environnement
const RIOT_API_KEY = process.env.RIOT_API_KEY;

// État global du processus de crawl (en mémoire)
declare global {
  // eslint-disable-next-line no-var
  var __CRAWL_PROCESS_STATE__: CrawlProcessState | undefined;
}

interface CrawlProcessState {
  isRunning: boolean;
  startedAt: Date | null;
  totalPlayers: number;
  processedPlayers: number;
  successfulPlayers: number;
  failedPlayers: number;
  totalMatchesCollected: number;
  currentPlayer: {
    puuid: string;
    region: string;
    gameName?: string | null;
  } | null;
  lastError: string | null;
  estimatedTimeRemaining: number | null; // en secondes
  avgTimePerPlayer: number; // en secondes
}

const defaultState: CrawlProcessState = {
  isRunning: false,
  startedAt: null,
  totalPlayers: 0,
  processedPlayers: 0,
  successfulPlayers: 0,
  failedPlayers: 0,
  totalMatchesCollected: 0,
  currentPlayer: null,
  lastError: null,
  estimatedTimeRemaining: null,
  avgTimePerPlayer: 3, // estimation initiale de 3 secondes par joueur
};

function getState(): CrawlProcessState {
  if (!global.__CRAWL_PROCESS_STATE__) {
    global.__CRAWL_PROCESS_STATE__ = { ...defaultState };
  }
  return global.__CRAWL_PROCESS_STATE__;
}

function updateState(updates: Partial<CrawlProcessState>) {
  const state = getState();
  Object.assign(state, updates);
}

function resetState() {
  global.__CRAWL_PROCESS_STATE__ = { ...defaultState };
}

const processSchema = z.object({
  batchSize: z.number().min(1).max(100).optional().default(10),
  delayBetweenPlayers: z.number().min(100).max(5000).optional().default(500),
});

/**
 * GET /api/crawl/process
 * Retourne l'état actuel du processus de crawl
 */
export async function GET() {
  const state = getState();

  // Récupérer les counts actuels depuis la base de données
  const [pendingCount, crawlingCount, completedCount, failedCount] = await Promise.all([
    prisma.discoveredPlayer.count({ where: { crawlStatus: "pending" } }),
    prisma.discoveredPlayer.count({ where: { crawlStatus: "crawling" } }),
    prisma.discoveredPlayer.count({ where: { crawlStatus: "completed" } }),
    prisma.discoveredPlayer.count({ where: { crawlStatus: "failed" } }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      ...state,
      queueStatus: {
        pending: pendingCount,
        crawling: crawlingCount,
        completed: completedCount,
        failed: failedCount,
      },
    },
  });
}

/**
 * POST /api/crawl/process
 * Crawle les prochains joueurs en attente dans la file par lots
 */
export async function POST(request: NextRequest) {
  try {
    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { error: "Clé API Riot Games non configurée" },
        { status: 500 }
      );
    }

    const state = getState();

    // Vérifier si un processus est déjà en cours
    if (state.isRunning) {
      return NextResponse.json(
        {
          error: "Un processus de crawl est déjà en cours",
          data: state,
        },
        { status: 409 }
      );
    }

    // Parser les options
    let options = { batchSize: 10, delayBetweenPlayers: 500 };
    try {
      const body = await request.json();
      options = processSchema.parse(body);
    } catch {
      // Utiliser les valeurs par défaut si le body est vide ou invalide
    }

    // Récupérer le nombre total de joueurs en attente
    const totalPending = await prisma.discoveredPlayer.count({
      where: { crawlStatus: "pending" },
    });

    if (totalPending === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "Aucun joueur en attente",
          data: {
            playersProcessed: 0,
            matchesCollected: 0,
          },
        },
        { status: 200 }
      );
    }

    // Initialiser l'état
    updateState({
      isRunning: true,
      startedAt: new Date(),
      totalPlayers: totalPending,
      processedPlayers: 0,
      successfulPlayers: 0,
      failedPlayers: 0,
      totalMatchesCollected: 0,
      currentPlayer: null,
      lastError: null,
      estimatedTimeRemaining: totalPending * state.avgTimePerPlayer,
    });

    // Lancer le traitement en arrière-plan (non-bloquant)
    processPlayersInBackground(options.batchSize, options.delayBetweenPlayers);

    return NextResponse.json({
      success: true,
      message: `Démarrage du crawl de ${totalPending} joueurs`,
      data: getState(),
    });
  } catch (error) {
    console.error("[CRAWL/PROCESS] Erreur:", error);
    resetState();
    return NextResponse.json(
      { error: "Erreur lors du démarrage du crawl" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/crawl/process
 * Arrête le processus de crawl en cours
 */
export async function DELETE() {
  const state = getState();

  if (!state.isRunning) {
    return NextResponse.json({
      success: true,
      message: "Aucun processus en cours",
    });
  }

  // Marquer comme arrêté (le processus vérifiera ce flag)
  updateState({ isRunning: false });

  // Remettre les joueurs "crawling" en "pending"
  await prisma.discoveredPlayer.updateMany({
    where: { crawlStatus: "crawling" },
    data: { crawlStatus: "pending" },
  });

  return NextResponse.json({
    success: true,
    message: "Processus arrêté",
    data: getState(),
  });
}

async function processPlayersInBackground(batchSize: number, delayBetweenPlayers: number) {
  const state = getState();
  const processingTimes: number[] = [];

  try {
    while (state.isRunning) {
      // Récupérer le prochain lot de joueurs
      const players = await prisma.discoveredPlayer.findMany({
        where: { crawlStatus: "pending" },
        take: batchSize,
        orderBy: { createdAt: "asc" },
      });

      if (players.length === 0) {
        // Plus de joueurs à traiter
        break;
      }

      for (const player of players) {
        // Vérifier si le processus a été arrêté
        if (!getState().isRunning) {
          break;
        }

        const playerStartTime = Date.now();

        try {
          // Mettre à jour l'état avec le joueur en cours
          updateState({
            currentPlayer: {
              puuid: player.puuid,
              region: player.riotRegion,
              gameName: player.riotGameName,
            },
          });

          // Marquer le joueur comme "crawling"
          await prisma.discoveredPlayer.update({
            where: { id: player.id },
            data: { crawlStatus: "crawling" },
          });

          // Appeler l'endpoint de collecte de matches
          const { POST } = await import("@/app/api/matches/collect/route");
          const mockRequest = new Request(
            "http://localhost:3000/api/matches/collect",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                puuid: player.puuid,
                region: player.riotRegion,
                count: MATCHES_FETCH_LIMIT,
              }),
            }
          );

          const collectResponse = await POST(mockRequest);
          const status = collectResponse.status;
          let collectResult: CollectResult = {};
          try {
            collectResult = await collectResponse.json();
          } catch {
            // Ignorer les erreurs de parsing
          }

          // 404 = aucun match trouvé: considérer comme complété
          const markAsCompleted = collectResponse.ok || status === 404;

          await prisma.discoveredPlayer.update({
            where: { id: player.id },
            data: {
              crawlStatus: markAsCompleted ? "completed" : "failed",
              lastCrawledAt: new Date(),
              matchesCollected: collectResult.matchesCollected || 0,
            },
          });

          const currentState = getState();
          if (markAsCompleted) {
            updateState({
              successfulPlayers: currentState.successfulPlayers + 1,
              totalMatchesCollected: currentState.totalMatchesCollected + (collectResult.matchesCollected || 0),
            });
          } else {
            updateState({
              failedPlayers: currentState.failedPlayers + 1,
              lastError: `Échec pour ${player.riotGameName || player.puuid.slice(0, 8)}...`,
            });
          }
        } catch (error) {
          console.error(`[CRAWL/PROCESS] Erreur pour ${player.puuid}:`, error);

          // Marquer le joueur comme "failed"
          await prisma.discoveredPlayer.update({
            where: { id: player.id },
            data: { crawlStatus: "failed" },
          });

          const currentState = getState();
          updateState({
            failedPlayers: currentState.failedPlayers + 1,
            lastError: error instanceof Error ? error.message : "Erreur inconnue",
          });
        }

        // Calculer le temps de traitement et mettre à jour les estimations
        const processingTime = (Date.now() - playerStartTime) / 1000;
        processingTimes.push(processingTime);

        // Garder seulement les 20 derniers temps pour la moyenne glissante
        if (processingTimes.length > 20) {
          processingTimes.shift();
        }

        const avgTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
        const currentState = getState();
        const remainingPlayers = currentState.totalPlayers - currentState.processedPlayers - 1;

        updateState({
          processedPlayers: currentState.processedPlayers + 1,
          avgTimePerPlayer: avgTime,
          estimatedTimeRemaining: Math.max(0, remainingPlayers * avgTime),
          currentPlayer: null,
        });

        // Délai entre chaque joueur pour éviter le rate limiting
        if (getState().isRunning && delayBetweenPlayers > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayBetweenPlayers));
        }
      }
    }
  } catch (error) {
    console.error("[CRAWL/PROCESS] Erreur globale:", error);
    updateState({
      lastError: error instanceof Error ? error.message : "Erreur globale",
    });
  } finally {
    // Marquer le processus comme terminé
    updateState({
      isRunning: false,
      currentPlayer: null,
    });
  }
}
