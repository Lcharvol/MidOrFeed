import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { REGION_TO_ROUTING } from "@/constants/regions";

const collectSchema = z.object({
  puuid: z.string().min(1, "PUUID est requis"),
  region: z.string().min(1, "Région est requise"),
  count: z.number().optional().default(20),
});

// Clé API Riot Games depuis les variables d'environnement
const RIOT_API_KEY = process.env.RIOT_API_KEY;

// Mapping des régions centralisé dans constants/regions

// Limiteur global par routing (europe/americas/asia)
type LimiterState = { nextAt: number };
declare global {
  var __RIOT_MATCH_LIMITER__: Record<string, LimiterState> | undefined;
}
function getLimiter(key: string) {
  if (!global.__RIOT_MATCH_LIMITER__) global.__RIOT_MATCH_LIMITER__ = {};
  const k = key.toLowerCase();
  if (!global.__RIOT_MATCH_LIMITER__[k]) {
    global.__RIOT_MATCH_LIMITER__[k] = { nextAt: 0 };
  }
  return global.__RIOT_MATCH_LIMITER__[k];
}
async function awaitPermit(key: string, minSpacingMs = 300) {
  const limiter = getLimiter(key);
  const now = Date.now();
  if (limiter.nextAt > now) {
    await new Promise((r) => setTimeout(r, limiter.nextAt - now));
  }
  const jitter = Math.floor(Math.random() * 50);
  limiter.nextAt = Date.now() + minSpacingMs + jitter;
}

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

    // Normaliser et vérifier que la région est valide
    const normalizedRegion = validatedData.region.toLowerCase();
    const routing = REGION_TO_ROUTING[normalizedRegion];
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

    // Pagination: itérer sur plusieurs pages tant qu'on peut collecter
    const pageSize = Math.min(validatedData.count, 30);
    const maxPages = Math.ceil(validatedData.count / pageSize) || 1;
    let matchesCollected = 0;
    let participantsCreated = 0;
    let page = 0;
    let exhausted = false;
    let totalIdsFound = 0;

    while (
      page < maxPages &&
      !exhausted &&
      matchesCollected < validatedData.count
    ) {
      const start = page * pageSize;
      await awaitPermit(routing, 350);
      let matchListResponse = await fetch(
        `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids?start=${start}&count=${pageSize}`,
        { headers: { "X-Riot-Token": RIOT_API_KEY } }
      );
      if (matchListResponse.status === 429) {
        const retryAfter = parseInt(
          matchListResponse.headers.get("Retry-After") || "2",
          10
        );
        const backoff = (isNaN(retryAfter) ? 2 : retryAfter) * 1000;
        getLimiter(routing).nextAt = Date.now() + backoff;
        await new Promise((r) => setTimeout(r, backoff));
        await awaitPermit(routing, 500);
        matchListResponse = await fetch(
          `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${validatedData.puuid}/ids?start=${start}&count=${pageSize}`,
          { headers: { "X-Riot-Token": RIOT_API_KEY } }
        );
      }

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
          // Plus de matchs
          break;
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
      totalIdsFound += matchIds.length;
      if (matchIds.length === 0) {
        exhausted = true;
        break;
      }

      for (const matchId of matchIds) {
        // Vérifier si le match existe déjà
        const existingMatch = await prisma.match.findUnique({
          where: { matchId },
        });

        if (existingMatch) {
          // Backfill participantPUuid if missing (older records)
          const existingParticipants = await prisma.matchParticipant.findMany({
            where: { matchId: existingMatch.id },
            select: { id: true, participantId: true, participantPUuid: true },
          });
          const hasMissing = existingParticipants.some(
            (p) => p.participantPUuid == null
          );
          if (!hasMissing) {
            continue; // nothing to update
          }

          // fetch details and update missing puuids
          await awaitPermit(routing, 350);
          let backfillRes = await fetch(
            `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
            { headers: { "X-Riot-Token": RIOT_API_KEY } }
          );
          if (backfillRes.status === 429) {
            const retryAfter = parseInt(
              backfillRes.headers.get("Retry-After") || "2",
              10
            );
            const backoff = (isNaN(retryAfter) ? 2 : retryAfter) * 1000;
            getLimiter(routing).nextAt = Date.now() + backoff;
            await new Promise((r) => setTimeout(r, backoff));
            await awaitPermit(routing, 500);
            backfillRes = await fetch(
              `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
              { headers: { "X-Riot-Token": RIOT_API_KEY } }
            );
          }
          if (backfillRes.ok) {
            const backfillData = await backfillRes.json();
            const participants: Array<{
              participantId: number;
              puuid?: string;
            }> = backfillData?.info?.participants || [];
            for (const p of participants) {
              const target = existingParticipants.find(
                (e) => e.participantId === p.participantId
              );
              if (target && !target.participantPUuid && p.puuid) {
                await prisma.matchParticipant.update({
                  where: { id: target.id },
                  data: { participantPUuid: p.puuid },
                });
              }
            }
          }

          continue; // processed existing match
        }

        // Appeler l'API pour obtenir les détails du match (nouveau match)
        await awaitPermit(routing, 350);
        let matchDetailsResponse = await fetch(
          `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
          { headers: { "X-Riot-Token": RIOT_API_KEY } }
        );
        if (matchDetailsResponse.status === 429) {
          const retryAfter = parseInt(
            matchDetailsResponse.headers.get("Retry-After") || "2",
            10
          );
          const backoff = (isNaN(retryAfter) ? 2 : retryAfter) * 1000;
          getLimiter(routing).nextAt = Date.now() + backoff;
          await new Promise((r) => setTimeout(r, backoff));
          await awaitPermit(routing, 500);
          matchDetailsResponse = await fetch(
            `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
            { headers: { "X-Riot-Token": RIOT_API_KEY } }
          );
        }

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
                info.platformId ||
                metadata.platformId ||
                normalizedRegion.toUpperCase(),
              queueId: info.queueId,
              region: normalizedRegion,
              blueTeamWon,
              redTeamWon,
            },
          });

          matchesCollected++;

          // Créer les participants
          for (const participant of info.participants) {
            try {
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

      // next page
      page++;
    }

    return NextResponse.json(
      {
        message: "Collecte terminée avec succès",
        matchesCollected,
        participantsCreated,
        totalFound: totalIdsFound,
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
