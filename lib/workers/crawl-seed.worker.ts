import { Job } from "pg-boss";
import { registerWorker, QUEUE_NAMES, updateJobProgress } from "../job-queue";
import { prisma } from "../prisma";
import { sendAlert, AlertSeverity } from "../alerting";
import { createLogger } from "../logger";
import type {
  CrawlSeedJobData,
  CrawlSeedJobResult,
} from "../queues/types";

const logger = createLogger("crawl-seed-worker");

const ALL_REGIONS = [
  "euw1", "eun1", "tr1", "ru",
  "na1", "la1", "la2", "br1",
  "kr", "jp1", "oc1",
  "ph2", "sg2", "th2", "tw2", "vn2",
];

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
 * Crawl Seed Worker
 * Discovers new players by extracting PUUIDs from recent match participants
 * and creating discoveredPlayer records with status "pending".
 * No Riot API calls — works entirely from existing match data.
 */
export async function createCrawlSeedWorker() {
  return registerWorker<CrawlSeedJobData, CrawlSeedJobResult>(
    QUEUE_NAMES.CRAWL_SEED,
    async (job: Job<CrawlSeedJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];
      let totalDiscovered = 0;
      let regionsProcessed = 0;

      try {
        const {
          regions = ALL_REGIONS,
          countPerRegion = 50,
        } = job.data;

        logger.info(`Starting job ${job.id} (${regions.length} regions, ${countPerRegion}/region)`);

        for (let i = 0; i < regions.length; i++) {
          const region = regions[i];
          const platformId = REGION_TO_PLATFORM[region];

          if (!platformId) {
            errors.push(`Unknown region: ${region}`);
            continue;
          }

          await updateJobProgress(job.id, {
            current: i,
            total: regions.length,
            message: `Processing ${region}`,
          });

          try {
            // Get PUUIDs from recent matches for this region
            const recentMatches = await prisma.match.findMany({
              where: { platformId },
              orderBy: { gameCreation: "desc" },
              take: 100,
              include: {
                participants: {
                  select: { participantPUuid: true },
                },
              },
            });

            const discoveredPUUIDs = new Set<string>();
            for (const match of recentMatches) {
              for (const p of match.participants) {
                if (p.participantPUuid) {
                  discoveredPUUIDs.add(p.participantPUuid);
                }
              }
            }

            if (discoveredPUUIDs.size === 0) {
              logger.info(`No matches found for ${region}, skipping`);
              continue;
            }

            // Filter out already-discovered PUUIDs
            const puuidArray = Array.from(discoveredPUUIDs);
            const existing = await prisma.discoveredPlayer.findMany({
              where: { puuid: { in: puuidArray } },
              select: { puuid: true },
            });
            const existingSet = new Set(existing.map((e) => e.puuid));
            const newPUUIDs = puuidArray
              .filter((p) => !existingSet.has(p))
              .slice(0, countPerRegion);

            // Create discoveredPlayer records
            let regionCount = 0;
            for (const puuid of newPUUIDs) {
              try {
                await prisma.discoveredPlayer.create({
                  data: {
                    puuid,
                    riotRegion: region,
                    crawlStatus: "pending",
                    matchesCollected: 0,
                  },
                });
                regionCount++;
              } catch {
                // Unique constraint violation — already exists, skip
              }
            }

            totalDiscovered += regionCount;
            regionsProcessed++;
            logger.info(`${region}: discovered ${regionCount} new players from ${recentMatches.length} matches`);
          } catch (err) {
            const msg = `Failed to seed ${region}: ${err instanceof Error ? err.message : "Unknown"}`;
            errors.push(msg);
            logger.error(msg);
          }
        }

        const duration = Date.now() - startTime;
        logger.info(`Completed: ${totalDiscovered} new players across ${regionsProcessed} regions in ${duration}ms`);

        if (errors.length > 0) {
          sendAlert(
            AlertSeverity.MEDIUM,
            "Crawl Seed Completed with Errors",
            `Discovered ${totalDiscovered} players with ${errors.length} errors`,
            "crawl-seed-worker",
            { errors: errors.slice(0, 5) }
          );
        }

        return { regionsProcessed, newPlayersDiscovered: totalDiscovered, duration, errors };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        logger.error(`Job failed: ${errorMsg}`);

        sendAlert(
          AlertSeverity.HIGH,
          "Crawl Seed Job Failed",
          errorMsg,
          "crawl-seed-worker",
          { jobId: job.id }
        );

        throw err;
      }
    }
  );
}
