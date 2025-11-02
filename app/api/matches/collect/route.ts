import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const collectSchema = z.object({
  puuid: z.string().min(1, "PUUID est requis"),
  region: z.string().min(1, "Région est requise"),
  count: z.number().optional().default(20),
});

// Clé API Riot Games depuis les variables d'environnement
const RIOT_API_KEY = process.env.RIOT_API_KEY;

// Mapping des régions vers leurs routing regions pour l'API Match
const REGION_TO_ROUTING: Record<string, string> = {
  // Europe
  euw1: "europe",
  eun1: "europe",
  tr1: "europe",
  ru: "europe",
  // Americas
  na1: "americas",
  la1: "americas",
  la2: "americas",
  br1: "americas",
  // Asia
  kr: "asia",
  jp1: "asia",
  oc1: "asia",
  ph2: "asia",
  sg2: "asia",
  th2: "asia",
  tw2: "asia",
  vn2: "asia",
};

/**
 * Route API pour collecter et stocker les matchs d'un utilisateur
 * POST /api/matches/collect
 * Body: { puuid: string, region: string, count?: number }
 */
export async function POST(request: Request) {
  try {
    // Vérifier que la clé API est configurée
    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { error: "Clé API Riot Games non configurée" },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Valider les données
    const validatedData = collectSchema.parse(body);

    // Vérifier que la région est valide
    const routing = REGION_TO_ROUTING[validatedData.region];
    if (!routing) {
      return NextResponse.json({ error: "Région invalide" }, { status: 400 });
    }

    // Récupérer le mapping championKey -> championId
    const champions = await prisma.champion.findMany();
    const championKeyToId = new Map(
      champions
        .filter((c) => c.championKey !== null)
        .map((c) => [c.championKey!, c.championId])
    );

    // Appeler l'API Match pour obtenir la liste des match IDs
    const matchListResponse = await fetch(
      `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids?start=0&count=${validatedData.count}`,
      {
        headers: {
          "X-Riot-Token": RIOT_API_KEY,
        },
      }
    );

    if (!matchListResponse.ok) {
      if (matchListResponse.status === 401) {
        return NextResponse.json(
          {
            error:
              "Clé API Riot invalide ou expirée. Veuillez la mettre à jour.",
          },
          { status: 401 }
        );
      }
      if (matchListResponse.status === 404) {
        return NextResponse.json(
          { error: "Aucun match trouvé pour cet utilisateur" },
          { status: 404 }
        );
      }
      const errorBody = await matchListResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: `Erreur API Riot: ${matchListResponse.status}`,
          details: errorBody,
        },
        { status: matchListResponse.status }
      );
    }

    const matchIds: string[] = await matchListResponse.json();

    if (matchIds.length === 0) {
      return NextResponse.json(
        { message: "Aucun match trouvé", matchesCollected: 0 },
        { status: 200 }
      );
    }

    // Collecter les détails de chaque match
    let matchesCollected = 0;
    let participantsCreated = 0;

    for (const matchId of matchIds) {
      // Vérifier si le match existe déjà
      const existingMatch = await prisma.match.findUnique({
        where: { matchId },
      });

      if (existingMatch) {
        continue; // Skip les matchs déjà enregistrés
      }

      // Appeler l'API pour obtenir les détails du match
      const matchDetailsResponse = await fetch(
        `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
        {
          headers: {
            "X-Riot-Token": RIOT_API_KEY,
          },
        }
      );

      if (!matchDetailsResponse.ok) {
        console.error(
          `Erreur lors de la récupération du match ${matchId}:`,
          matchDetailsResponse.status
        );
        continue;
      }

      const matchData = await matchDetailsResponse.json();

      try {
        // Extraire les informations du match
        const info = matchData.info;
        const metadata = matchData.metadata;

        // Déterminer les résultats des équipes
        const team100 = info.teams.find(
          (t: { teamId: number; win?: boolean }) => t.teamId === 100
        );
        const team200 = info.teams.find(
          (t: { teamId: number; win?: boolean }) => t.teamId === 200
        );
        const blueTeamWon = team100?.win || false;
        const redTeamWon = team200?.win || false;

        // Créer le match
        const match = await prisma.match.create({
          data: {
            matchId: metadata.matchId,
            gameCreation: BigInt(info.gameCreation),
            gameDuration: info.gameDuration,
            gameMode: info.gameMode,
            gameType: info.gameType,
            gameVersion: info.gameVersion,
            mapId: info.mapId,
            platformId:
              info.platformId || metadata.platformId || validatedData.region,
            queueId: info.queueId,
            region: validatedData.region,
            blueTeamWon,
            redTeamWon,
          },
        });

        matchesCollected++;

        // Créer les participants
        for (const participant of info.participants) {
          try {
            // Convertir le championKey numérique en championId string
            const championId =
              championKeyToId.get(participant.championId) ||
              String(participant.championId);

            await prisma.matchParticipant.create({
              data: {
                matchId: match.id,
                participantId: participant.participantId,
                participantPUuid: participant.puuid || null,
                teamId: participant.teamId,
                championId,
                role: participant.teamPosition,
                lane: participant.lane,
                kills: participant.kills,
                deaths: participant.deaths,
                assists: participant.assists,
                goldEarned: participant.goldEarned,
                goldSpent: participant.goldSpent,
                totalDamageDealtToChampions:
                  participant.totalDamageDealtToChampions,
                totalDamageTaken: participant.totalDamageTaken,
                visionScore: participant.visionScore,
                win: participant.win,
                item0: participant.item0,
                item1: participant.item1,
                item2: participant.item2,
                item3: participant.item3,
                item4: participant.item4,
                item5: participant.item5,
                item6: participant.item6,
                summoner1Id: participant.summoner1Id,
                summoner2Id: participant.summoner2Id,
              },
            });
            participantsCreated++;
          } catch (participantError) {
            console.error(
              `Erreur lors de la création du participant ${participant.participantId} pour le match ${matchId}:`,
              participantError
            );
          }
        }
      } catch (error) {
        console.error(
          `Erreur lors de la sauvegarde du match ${matchId}:`,
          error
        );
        continue;
      }
    }

    return NextResponse.json(
      {
        message: "Collecte terminée avec succès",
        matchesCollected,
        participantsCreated,
        totalFound: matchIds.length,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la collecte des matchs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la collecte des matchs" },
      { status: 500 }
    );
  }
}
