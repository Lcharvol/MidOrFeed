import { Worker, Job } from "bullmq";
import { getRedisConnection } from "../redis";
import { QUEUE_NAMES } from "../queues";
import { prisma } from "../prisma";
import { riotApiRequest } from "../riot-api";
import { sendAlert, AlertSeverity } from "../alerting";
import { REGION_TO_ROUTING } from "@/constants/regions";
import type {
  DataCrawlJobData,
  DataCrawlJobResult,
  JobProgress,
} from "../queues/types";

/**
 * Data Crawl Worker
 * Crawls discovered players to collect their match history
 */
export function createDataCrawlWorker() {
  const worker = new Worker<DataCrawlJobData, DataCrawlJobResult>(
    QUEUE_NAMES.DATA_CRAWL,
    async (job: Job<DataCrawlJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];
      let playersCrawled = 0;
      let matchesCollected = 0;
      let newPlayersDiscovered = 0;

      try {
        console.log(`[Data Crawl] Starting job ${job.id}`);

        const {
          region,
          limit = 10,
          matchesPerPlayer = 20,
        } = job.data;

        // Get pending players to crawl
        const players = await prisma.discoveredPlayer.findMany({
          where: {
            crawlStatus: "pending",
            ...(region ? { riotRegion: region } : {}),
          },
          take: limit,
          orderBy: { createdAt: "asc" },
        });

        const total = players.length;
        console.log(`[Data Crawl] Found ${total} players to crawl`);

        for (let i = 0; i < players.length; i++) {
          const player = players[i];

          try {
            // Mark as in progress
            await prisma.discoveredPlayer.update({
              where: { id: player.id },
              data: { crawlStatus: "crawling" },
            });

            // Get routing for the region
            const routing = REGION_TO_ROUTING[player.riotRegion] || "europe";

            // Fetch match history
            const matchListUrl = `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${player.puuid}/ids?start=0&count=${matchesPerPlayer}`;

            const { data: matchIds } = await riotApiRequest<string[]>(matchListUrl, {
              useCache: false,
            });

            // Process each match
            for (const matchId of matchIds) {
              try {
                // Check if match already exists
                const existingMatch = await prisma.match.findUnique({
                  where: { matchId },
                });

                if (existingMatch) continue;

                // Fetch match details
                const matchUrl = `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
                const { data: matchData } = await riotApiRequest<{
                  info: {
                    gameCreation: number;
                    gameDuration: number;
                    gameMode: string;
                    gameType: string;
                    gameVersion: string;
                    mapId: number;
                    platformId: string;
                    queueId: number;
                    participants: Array<{
                      participantId: number;
                      teamId: number;
                      championId: number;
                      championName: string;
                      kills: number;
                      deaths: number;
                      assists: number;
                      goldEarned: number;
                      goldSpent: number;
                      totalDamageDealtToChampions: number;
                      totalDamageTaken: number;
                      visionScore: number;
                      win: boolean;
                      item0: number;
                      item1: number;
                      item2: number;
                      item3: number;
                      item4: number;
                      item5: number;
                      item6: number;
                      summoner1Id: number;
                      summoner2Id: number;
                      riotIdGameName?: string;
                      riotIdTagline?: string;
                      puuid: string;
                      teamPosition?: string;
                      lane?: string;
                    }>;
                    teams: Array<{ teamId: number; win: boolean }>;
                  };
                }>(matchUrl, { useCache: false });

                // Create match and participants
                const blueTeam = matchData.info.teams.find(t => t.teamId === 100);
                const redTeam = matchData.info.teams.find(t => t.teamId === 200);

                await prisma.match.create({
                  data: {
                    matchId,
                    gameCreation: BigInt(matchData.info.gameCreation),
                    gameDuration: matchData.info.gameDuration,
                    gameMode: matchData.info.gameMode,
                    gameType: matchData.info.gameType,
                    gameVersion: matchData.info.gameVersion,
                    mapId: matchData.info.mapId,
                    platformId: matchData.info.platformId,
                    queueId: matchData.info.queueId,
                    region: player.riotRegion,
                    blueTeamWon: blueTeam?.win ?? null,
                    redTeamWon: redTeam?.win ?? null,
                    participants: {
                      create: matchData.info.participants.map((p) => ({
                        participantId: p.participantId,
                        teamId: p.teamId,
                        championId: String(p.championId),
                        role: p.teamPosition || null,
                        lane: p.lane || null,
                        kills: p.kills,
                        deaths: p.deaths,
                        assists: p.assists,
                        goldEarned: p.goldEarned,
                        goldSpent: p.goldSpent,
                        totalDamageDealtToChampions: p.totalDamageDealtToChampions,
                        totalDamageTaken: p.totalDamageTaken,
                        visionScore: p.visionScore,
                        win: p.win,
                        item0: p.item0,
                        item1: p.item1,
                        item2: p.item2,
                        item3: p.item3,
                        item4: p.item4,
                        item5: p.item5,
                        item6: p.item6,
                        summoner1Id: p.summoner1Id,
                        summoner2Id: p.summoner2Id,
                        riotIdGameName: p.riotIdGameName,
                        riotIdTagline: p.riotIdTagline,
                        participantPUuid: p.puuid,
                      })),
                    },
                  },
                });

                matchesCollected++;

                // Discover new players from this match
                for (const p of matchData.info.participants) {
                  if (p.puuid !== player.puuid) {
                    const existing = await prisma.discoveredPlayer.findUnique({
                      where: { puuid: p.puuid },
                    });

                    if (!existing) {
                      await prisma.discoveredPlayer.create({
                        data: {
                          puuid: p.puuid,
                          riotGameName: p.riotIdGameName,
                          riotTagLine: p.riotIdTagline,
                          riotRegion: player.riotRegion,
                          crawlStatus: "pending",
                        },
                      });
                      newPlayersDiscovered++;
                    }
                  }
                }
              } catch (matchErr) {
                // Skip individual match errors
                console.error(`[Data Crawl] Error processing match ${matchId}:`, matchErr);
              }
            }

            // Mark as completed
            await prisma.discoveredPlayer.update({
              where: { id: player.id },
              data: {
                crawlStatus: "completed",
                lastCrawledAt: new Date(),
                matchesCollected: { increment: matchesCollected },
              },
            });

            playersCrawled++;

            const progress: JobProgress = {
              current: i + 1,
              total,
              message: `Crawled ${player.riotGameName || player.puuid.slice(0, 8)} (${i + 1}/${total})`,
            };
            await job.updateProgress(progress);
          } catch (err) {
            const errorMsg = `Failed to crawl player ${player.puuid}: ${
              err instanceof Error ? err.message : "Unknown error"
            }`;
            errors.push(errorMsg);
            console.error(`[Data Crawl] ${errorMsg}`);

            // Mark as failed
            await prisma.discoveredPlayer.update({
              where: { id: player.id },
              data: { crawlStatus: "failed" },
            });
          }
        }

        const duration = Date.now() - startTime;
        console.log(
          `[Data Crawl] Completed: ${playersCrawled} players, ${matchesCollected} matches, ${newPlayersDiscovered} new players in ${duration}ms`
        );

        if (errors.length > 0) {
          sendAlert(
            AlertSeverity.MEDIUM,
            "Data Crawl Completed with Errors",
            `Crawled ${playersCrawled}/${total} players with ${errors.length} errors`,
            "data-crawl-worker",
            { errors: errors.slice(0, 5) }
          );
        }

        return { playersCrawled, matchesCollected, newPlayersDiscovered, duration, errors };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[Data Crawl] Job failed:`, err);

        sendAlert(
          AlertSeverity.HIGH,
          "Data Crawl Job Failed",
          errorMsg,
          "data-crawl-worker",
          { jobId: job.id }
        );

        throw err;
      }
    },
    {
      ...getRedisConnection(),
      concurrency: 1,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[Data Crawl] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Data Crawl] Job ${job?.id} failed:`, err);
  });

  return worker;
}
