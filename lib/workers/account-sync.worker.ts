import { Job } from "pg-boss";
import { Prisma } from "@prisma/client";
import { registerWorker, QUEUE_NAMES, updateJobProgress } from "../job-queue";
import { prisma } from "../prisma";
import { ShardedLeagueAccounts } from "../prisma-sharded-accounts";
import { sendAlert, AlertSeverity } from "../alerting";
import { createLogger } from "../logger";
import type {
  AccountSyncJobData,
  AccountSyncJobResult,
} from "../queues/types";

const logger = createLogger("account-sync-worker");

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

/**
 * Account Sync Worker
 * Converts match participants into LeagueAccount records with computed stats.
 * Processes a batch per run (no Riot API calls — account-refresh handles that).
 */
export async function createAccountSyncWorker() {
  return registerWorker<AccountSyncJobData, AccountSyncJobResult>(
    QUEUE_NAMES.ACCOUNT_SYNC,
    async (job: Job<AccountSyncJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];
      let accountsCreated = 0;
      let accountsSkipped = 0;

      try {
        const { batchSize = 500 } = job.data;

        logger.info(`Starting job ${job.id} (batch ${batchSize})`);

        // Get a batch of distinct PUUIDs from match_participants
        const batch = await prisma.$queryRaw<{ participantPUuid: string }[]>`
          SELECT DISTINCT mp."participantPUuid"
          FROM "match_participants" mp
          WHERE mp."participantPUuid" IS NOT NULL
          ORDER BY mp."participantPUuid"
          LIMIT ${batchSize}
        `;

        const total = batch.length;
        logger.info(`Found ${total} PUUIDs to process`);

        if (total === 0) {
          return { accountsCreated: 0, accountsSkipped: 0, duration: Date.now() - startTime, errors };
        }

        const puuids = batch.map((p) => p.participantPUuid).filter(Boolean);

        // Batch-compute stats for all PUUIDs
        const batchStats = await prisma.matchParticipant.groupBy({
          by: ["participantPUuid"],
          where: { participantPUuid: { in: puuids } },
          _count: { id: true },
          _sum: { kills: true, deaths: true, assists: true },
        });

        const batchWins = await prisma.matchParticipant.groupBy({
          by: ["participantPUuid"],
          where: { participantPUuid: { in: puuids }, win: true },
          _count: { id: true },
        });

        const batchMostPlayed = await prisma.$queryRaw<{ participantPUuid: string; championId: number }[]>`
          SELECT "participantPUuid", "championId"
          FROM (
            SELECT "participantPUuid", "championId",
                   ROW_NUMBER() OVER (PARTITION BY "participantPUuid" ORDER BY COUNT(*) DESC) as rn
            FROM "match_participants"
            WHERE "participantPUuid" IN (${Prisma.join(puuids)})
            GROUP BY "participantPUuid", "championId"
          ) sub
          WHERE rn = 1
        `;

        const batchRegions = await prisma.matchParticipant.findMany({
          where: { participantPUuid: { in: puuids } },
          select: { participantPUuid: true, match: { select: { platformId: true } } },
          distinct: ["participantPUuid"],
        });

        const statsMap = new Map(batchStats.map((s) => [s.participantPUuid, s]));
        const winsMap = new Map(batchWins.map((w) => [w.participantPUuid, w._count.id]));
        const mostPlayedMap = new Map(batchMostPlayed.map((m) => [m.participantPUuid, m.championId]));
        const regionMap = new Map(batchRegions.map((s) => [s.participantPUuid!, s.match.platformId]));

        for (let i = 0; i < puuids.length; i++) {
          const puuid = puuids[i];

          if (i % 50 === 0) {
            await updateJobProgress(job.id, {
              current: i,
              total,
              message: `Processing ${i + 1}/${total}`,
            });
          }

          try {
            const playerStats = statsMap.get(puuid);
            const totalMatches = playerStats?._count.id || 0;

            if (totalMatches === 0) {
              accountsSkipped++;
              continue;
            }

            const wins = winsMap.get(puuid) || 0;
            const losses = totalMatches - wins;
            const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

            const totalKills = playerStats?._sum.kills || 0;
            const totalDeaths = playerStats?._sum.deaths || 0;
            const totalAssists = playerStats?._sum.assists || 0;
            const avgKDA =
              totalDeaths > 0
                ? (totalKills + totalAssists) / totalDeaths
                : totalKills + totalAssists;

            const mostPlayedRaw = mostPlayedMap.get(puuid);
            const mostPlayedChampion = mostPlayedRaw != null ? String(mostPlayedRaw) : null;

            const platformId = regionMap.get(puuid) || "UNKNOWN";
            const region = PLATFORM_TO_REGION[platformId] || null;

            if (!region) {
              accountsSkipped++;
              continue;
            }

            await ShardedLeagueAccounts.upsert({
              puuid,
              riotRegion: region.toLowerCase(),
              totalMatches,
              totalWins: wins,
              totalLosses: losses,
              winRate,
              avgKDA,
              mostPlayedChampion,
            });

            accountsCreated++;
          } catch (err) {
            const errorMsg = `Failed to sync ${puuid}: ${err instanceof Error ? err.message : "Unknown"}`;
            errors.push(errorMsg);
            logger.error(errorMsg);
          }
        }

        const duration = Date.now() - startTime;
        logger.info(`Completed: ${accountsCreated} synced, ${accountsSkipped} skipped in ${duration}ms`);

        if (errors.length > 0) {
          sendAlert(
            AlertSeverity.MEDIUM,
            "Account Sync Completed with Errors",
            `Synced ${accountsCreated}/${total} accounts with ${errors.length} errors`,
            "account-sync-worker",
            { errors: errors.slice(0, 5) }
          );
        }

        return { accountsCreated, accountsSkipped, duration, errors };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        logger.error(`Job failed: ${errorMsg}`);

        sendAlert(
          AlertSeverity.HIGH,
          "Account Sync Job Failed",
          errorMsg,
          "account-sync-worker",
          { jobId: job.id }
        );

        throw err;
      }
    }
  );
}
