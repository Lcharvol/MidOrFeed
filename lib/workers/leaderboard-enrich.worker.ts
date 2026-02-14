import { Job } from "pg-boss";
import { registerWorker, QUEUE_NAMES, updateJobProgress } from "../job-queue";
import { prisma } from "../prisma";
import { riotApiRequest } from "../riot-api";
import { ShardedLeagueAccounts } from "../prisma-sharded-accounts";
import { sendAlert, AlertSeverity } from "../alerting";
import { createLogger } from "../logger";
import { MAIN_REGIONS } from "../../constants/riot-regions";
import { REGION_TO_ROUTING } from "../../constants/regions";
import type {
  LeaderboardEnrichJobData,
  LeaderboardEnrichJobResult,
} from "../queues/types";

const logger = createLogger("leaderboard-enrich-worker");

type AccountResponse = {
  puuid: string;
  gameName: string;
  tagLine: string;
};

type SummonerResponse = {
  id: string;
  accountId: string;
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
  revisionDate: number;
};

/**
 * Leaderboard Enrich Worker
 * Calls Riot API (Account v1 + Summoner v4) to populate sharded tables
 * for leaderboard players that are missing gameName/profileIconId.
 */
export async function createLeaderboardEnrichWorker() {
  return registerWorker<LeaderboardEnrichJobData, LeaderboardEnrichJobResult>(
    QUEUE_NAMES.LEADERBOARD_ENRICH,
    async (job: Job<LeaderboardEnrichJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];
      let accountsEnriched = 0;
      let accountsSkipped = 0;

      try {
        logger.info(`Starting job ${job.id}`);

        const {
          regions = MAIN_REGIONS as unknown as string[],
          limit = 200,
        } = job.data;

        let totalProcessed = 0;

        for (const region of regions) {
          // Find leaderboard entries with puuid that need enrichment
          const entries = await prisma.leaderboardEntry.findMany({
            where: {
              region,
              puuid: { not: null },
            },
            select: { puuid: true },
            distinct: ["puuid"],
          });

          const puuids = entries
            .map((e) => e.puuid)
            .filter((p): p is string => !!p);

          if (puuids.length === 0) {
            logger.info(`No entries with puuid for ${region}, skipping`);
            continue;
          }

          // Check which puuids already have complete data in sharded tables
          let existingAccounts: Array<{
            puuid: string;
            riotGameName: string | null;
            riotTagLine: string | null;
            profileIconId: number | null;
            mostPlayedChampion: string | null;
          }> = [];
          try {
            existingAccounts =
              await ShardedLeagueAccounts.findManyByPuuidsForLeaderboard(
                puuids,
                region
              );
          } catch {
            // Table might not exist yet for this region
            logger.warn(`Could not query sharded table for ${region}`);
          }

          const existingSet = new Set(
            existingAccounts
              .filter((a) => a.riotGameName && a.profileIconId !== null)
              .map((a) => a.puuid)
          );

          // Filter to puuids that need enrichment
          const toEnrich = puuids.filter((p) => !existingSet.has(p));

          if (toEnrich.length === 0) {
            logger.info(`All ${puuids.length} entries for ${region} already enriched`);
            continue;
          }

          // Limit per region to avoid rate limit issues
          const batch = toEnrich.slice(0, limit);
          logger.info(
            `Enriching ${batch.length}/${toEnrich.length} entries for ${region}`
          );

          const routing = REGION_TO_ROUTING[region] || "europe";

          for (let i = 0; i < batch.length; i++) {
            const puuid = batch[i];
            totalProcessed++;

            await updateJobProgress(job.id, {
              current: totalProcessed,
              total: batch.length * regions.length,
              message: `Enriching ${region}: ${i + 1}/${batch.length}`,
            });

            try {
              // Account v1 — get gameName + tagLine
              const accountUrl = `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`;
              let gameName: string | null = null;
              let tagLine: string | null = null;

              try {
                const { data: accountData } =
                  await riotApiRequest<AccountResponse>(accountUrl, {
                    useCache: false,
                  });
                gameName = accountData.gameName;
                tagLine = accountData.tagLine;
              } catch (err) {
                logger.warn(`Could not fetch account data for ${puuid}`);
                accountsSkipped++;
                continue;
              }

              // Summoner v4 — get profileIconId
              const summonerUrl = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`;
              let profileIconId: number | null = null;
              let summonerId: string | null = null;
              let accountId: string | null = null;
              let summonerLevel: number | null = null;

              try {
                const { data: summonerData } =
                  await riotApiRequest<SummonerResponse>(summonerUrl, {
                    useCache: false,
                  });
                profileIconId = summonerData.profileIconId;
                summonerId = summonerData.id;
                accountId = summonerData.accountId;
                summonerLevel = summonerData.summonerLevel;
              } catch (err) {
                // Summoner not found — still upsert with account data
                logger.warn(`Could not fetch summoner data for ${puuid}`);
              }

              // Upsert into sharded table
              await ShardedLeagueAccounts.upsert({
                puuid,
                riotRegion: region,
                riotGameName: gameName,
                riotTagLine: tagLine,
                riotSummonerId: summonerId,
                riotAccountId: accountId,
                summonerLevel,
                profileIconId,
              });

              accountsEnriched++;
              logger.debug(
                `Enriched ${gameName}#${tagLine} (icon: ${profileIconId})`
              );
            } catch (err) {
              const errorMsg = `Failed to enrich ${puuid} in ${region}: ${
                err instanceof Error ? err.message : "Unknown error"
              }`;
              errors.push(errorMsg);
              logger.error(errorMsg);
            }

            // Small delay to respect rate limits
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        const duration = Date.now() - startTime;
        logger.info(
          `Completed: ${accountsEnriched} enriched, ${accountsSkipped} skipped in ${duration}ms`
        );

        if (errors.length > 0) {
          sendAlert(
            AlertSeverity.MEDIUM,
            "Leaderboard Enrich Completed with Errors",
            `Enriched ${accountsEnriched} accounts with ${errors.length} errors`,
            "leaderboard-enrich-worker",
            { errors: errors.slice(0, 5) }
          );
        }

        return { accountsEnriched, accountsSkipped, duration, errors };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        logger.error(`Job failed: ${errorMsg}`);

        sendAlert(
          AlertSeverity.HIGH,
          "Leaderboard Enrich Job Failed",
          errorMsg,
          "leaderboard-enrich-worker",
          { jobId: job.id }
        );

        throw err;
      }
    }
  );
}
