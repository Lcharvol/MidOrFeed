import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Clé API Riot Games depuis les variables d'environnement
const RIOT_API_KEY = process.env.RIOT_API_KEY;

/**
 * POST /api/crawl/process
 * Crawle les prochains joueurs en attente dans la file
 */
export async function POST(request: Request) {
  try {
    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { error: "Clé API Riot Games non configurée" },
        { status: 500 }
      );
    }

    // Récupérer TOUS les joueurs en attente
    const pendingPlayers = await prisma.discoveredPlayer.findMany({
      where: {
        crawlStatus: "pending",
      },
    });

    if (pendingPlayers.length === 0) {
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

    let totalMatchesCollected = 0;

    for (const player of pendingPlayers) {
      try {
        // Marquer le joueur comme "crawling"
        await prisma.discoveredPlayer.update({
          where: { id: player.id },
          data: { crawlStatus: "crawling" },
        });

        // Appeler l'endpoint de collecte de matches via fetch interne
        const { POST } = await import("@/app/api/matches/collect/route");
        const mockRequest = new Request(
          "http://localhost:3000/api/matches/collect",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              puuid: player.puuid,
              region: player.riotRegion,
              count: 100,
            }),
          }
        );

        const collectResponse = await POST(mockRequest);
        const status = collectResponse.status;
        let collectResult: any = {};
        try {
          collectResult = await collectResponse.json();
        } catch {}
        const collectResponseOk = collectResponse.ok;

        // Log explicite en cas d'échec
        if (!collectResponseOk) {
          console.error(
            `[CRAWL/PROCESS] Collect failed for ${player.puuid} (${player.riotRegion}) - status ${status}:`,
            collectResult
          );
        }

        // 404 = aucun match trouvé: considérer comme complété (0 matches), pas failed
        const markAsCompleted = collectResponseOk || status === 404;

        await prisma.discoveredPlayer.update({
          where: { id: player.id },
          data: {
            crawlStatus: markAsCompleted ? "completed" : "failed",
            lastCrawledAt: new Date(),
            matchesCollected: collectResult.matchesCollected || 0,
          },
        });

        if (markAsCompleted) {
          totalMatchesCollected += collectResult.matchesCollected || 0;
        }
      } catch (error) {
        console.error(
          `[CRAWL/PROCESS] Erreur pour player ${player.puuid}:`,
          error
        );

        // Marquer le joueur comme "failed"
        await prisma.discoveredPlayer.update({
          where: { id: player.id },
          data: { crawlStatus: "failed" },
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Crawl terminé",
        data: {
          playersProcessed: pendingPlayers.length,
          matchesCollected: totalMatchesCollected,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CRAWL/PROCESS] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors du crawl" },
      { status: 500 }
    );
  }
}
