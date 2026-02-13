import { NextRequest, NextResponse } from "next/server";
import { REGION_TO_ROUTING } from "@/constants/regions";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

const seedSchema = z.object({
  region: z.string().min(1, "Région requise"),
  count: z.number().min(1).default(20), // Nombre de joueurs à découvrir
});

// Mapping des régions
// Routing mapping centralisé dans constants/regions

const REGION_TO_PLATFORM: Record<string, string> = {
  euw1: "EUW1",
  eun1: "EUN1",
  tr1: "TR1",
  ru: "RU",
  na1: "NA1",
  la1: "LA1",
  la2: "LA2",
  br1: "BR1",
  kr: "KR",
  jp1: "JP1",
  oc1: "OC1",
  ph2: "PH2",
  sg2: "SG2",
  th2: "TH2",
  tw2: "TW2",
  vn2: "VN2",
};

/**
 * POST /api/crawl/seed
 * Découvre de nouveaux joueurs en crawlant les matchs les plus récents
 * via Riot API (Challenger/Master/GrandMaster)
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request, { skipCsrf: true });
  if (authError) return authError;

  try {
    const RIOT_API_KEY = getEnv().RIOT_API_KEY;
    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Clé API Riot Games non configurée" },
        { status: 500 }
      );
    }

    // Lire et valider la taille du body
    const { readAndValidateBody } = await import("@/lib/request-validation");
    const body = await readAndValidateBody(request);
    const validatedData = seedSchema.parse(body);

    const routing = REGION_TO_ROUTING[validatedData.region];
    const platformId = REGION_TO_PLATFORM[validatedData.region];

    if (!routing || !platformId) {
      return NextResponse.json({ success: false, error: "Région invalide" }, { status: 400 });
    }

    // Étape 1: Obtenir les PUUID depuis les matchs récents
    // On va utiliser l'endpoint de match history et extraire les PUUID des participants
    const discoveredPUUIDs = new Set<string>();

    const recentMatches = await prisma.match.findMany({
      where: {
        platformId,
      },
      orderBy: {
        gameCreation: "desc",
      },
      take: 100,
      include: {
        participants: true,
      },
    });

    if (recentMatches.length === 0) {
      // Si pas de matchs, utiliser les utilisateurs enregistrés comme seed
      const { getLeagueAccountsTableName } = await import(
        "@/lib/prisma-sharded-accounts"
      );
      const { escapeSqlIdentifier } = await import("@/lib/sql-sanitization");
      const tableName = getLeagueAccountsTableName(validatedData.region);
      const safeTable = escapeSqlIdentifier(tableName);
      const accounts = await prisma.$queryRawUnsafe<Array<{ puuid: string }>>(
        `SELECT "puuid" FROM ${safeTable} LIMIT 50`
      );
      for (const acc of accounts) {
        if (acc.puuid) discoveredPUUIDs.add(acc.puuid);
      }
    } else {
      // Extraire tous les PUUID uniques des participants
      for (const match of recentMatches) {
        for (const participant of match.participants) {
          if (participant.participantPUuid) {
            discoveredPUUIDs.add(participant.participantPUuid);
          }
        }
      }
    }

    // Étape 2: Filtrer les PUUID déjà découverts
    const existingPUUIDs = await prisma.discoveredPlayer.findMany({
      where: {
        puuid: { in: Array.from(discoveredPUUIDs) },
      },
      select: { puuid: true },
    });

    const existingPUUIDsSet = new Set(
      existingPUUIDs.map((p: { puuid: string }) => p.puuid)
    );
    const newPUUIDs = Array.from(discoveredPUUIDs).filter(
      (puuid) => !existingPUUIDsSet.has(puuid)
    );

    // Prendre seulement le nombre demandé de nouveaux PUUID
    const puuidsToAdd = newPUUIDs.slice(0, validatedData.count);

    // Étape 3: Enregistrer les nouveaux PUUID dans la base
    let newPlayersCount = 0;
    for (const puuid of puuidsToAdd) {
      try {
        await prisma.discoveredPlayer.create({
          data: {
            puuid,
            riotRegion: validatedData.region,
            crawlStatus: "pending",
            matchesCollected: 0,
          },
        });
        newPlayersCount++;
      } catch (error) {
        logger.error("Erreur enregistrement PUUID", error instanceof Error ? error : new Error(String(error)), { puuid });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Seed terminé",
        data: {
          matchesAnalyzed: recentMatches.length,
          uniquePUUIDs: discoveredPUUIDs.size,
          newPlayersAdded: newPlayersCount,
        },
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

    logger.error("Erreur lors du seed", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ success: false, error: "Erreur lors du seed" }, { status: 500 });
  }
}
