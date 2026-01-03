import { Worker, Job } from "bullmq";
import { getRedisConnection } from "../redis";
import { QUEUE_NAMES } from "../queues";
import { prisma } from "../prisma";
import { riotApiRequest } from "../riot-api";
import { sendAlert, AlertSeverity } from "../alerting";
import { notifyJobCompleted, notifyJobFailed } from "./job-notifications";
import { REGION_TO_ROUTING } from "@/constants/regions";
import type {
  AccountRefreshJobData,
  AccountRefreshJobResult,
  JobProgress,
} from "../queues/types";

type SummonerResponse = {
  id: string;
  accountId: string;
  puuid: string;
  name?: string;
  profileIconId: number;
  summonerLevel: number;
  revisionDate: number;
};

type AccountResponse = {
  puuid: string;
  gameName: string;
  tagLine: string;
};

/**
 * Account Refresh Worker
 * Refreshes linked account information (level, icon, name, etc.)
 */
export function createAccountRefreshWorker() {
  const worker = new Worker<AccountRefreshJobData, AccountRefreshJobResult>(
    QUEUE_NAMES.ACCOUNT_REFRESH,
    async (job: Job<AccountRefreshJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];
      let accountsRefreshed = 0;
      let accountsNotFound = 0;

      try {
        console.log(`[Account Refresh] Starting job ${job.id}`);

        const { limit = 100, staleHours = 24 } = job.data;

        // Calculate cutoff time
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - staleHours);

        // Get stale accounts to refresh
        const accounts = await prisma.leagueOfLegendsAccount.findMany({
          where: {
            updatedAt: { lt: cutoffTime },
          },
          take: limit,
          orderBy: { updatedAt: "asc" },
        });

        const total = accounts.length;
        console.log(`[Account Refresh] Found ${total} accounts to refresh`);

        for (let i = 0; i < accounts.length; i++) {
          const account = accounts[i];

          const progress: JobProgress = {
            current: i + 1,
            total,
            message: `Refreshing ${account.riotGameName || account.puuid.slice(0, 8)} (${i + 1}/${total})`,
          };
          await job.updateProgress(progress);

          try {
            const routing = REGION_TO_ROUTING[account.riotRegion] || "europe";

            // Fetch account info (game name, tag line)
            const accountUrl = `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${account.puuid}`;

            let gameName = account.riotGameName;
            let tagLine = account.riotTagLine;

            try {
              const { data: accountData } = await riotApiRequest<AccountResponse>(accountUrl, {
                useCache: false,
              });
              gameName = accountData.gameName;
              tagLine = accountData.tagLine;
            } catch (err) {
              // Account might not exist anymore
              console.warn(`[Account Refresh] Could not fetch account data for ${account.puuid}`);
            }

            // Fetch summoner info (level, icon)
            const summonerUrl = `https://${account.riotRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${account.puuid}`;

            try {
              const { data: summonerData } = await riotApiRequest<SummonerResponse>(summonerUrl, {
                useCache: false,
              });

              // Update account
              await prisma.leagueOfLegendsAccount.update({
                where: { id: account.id },
                data: {
                  riotGameName: gameName,
                  riotTagLine: tagLine,
                  riotSummonerId: summonerData.id,
                  riotAccountId: summonerData.accountId,
                  summonerLevel: summonerData.summonerLevel,
                  profileIconId: summonerData.profileIconId,
                  revisionDate: BigInt(summonerData.revisionDate),
                  updatedAt: new Date(),
                },
              });

              accountsRefreshed++;
              console.log(
                `[Account Refresh] Refreshed ${gameName}#${tagLine} (level ${summonerData.summonerLevel})`
              );
            } catch (err) {
              // Summoner not found - might have been deleted or name changed
              if (err instanceof Error && err.message.includes("404")) {
                accountsNotFound++;
                console.warn(`[Account Refresh] Summoner not found: ${account.puuid}`);
              } else {
                throw err;
              }
            }
          } catch (err) {
            const errorMsg = `Failed to refresh ${account.puuid}: ${
              err instanceof Error ? err.message : "Unknown error"
            }`;
            errors.push(errorMsg);
            console.error(`[Account Refresh] ${errorMsg}`);
          }

          // Small delay to respect rate limits
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const duration = Date.now() - startTime;
        console.log(
          `[Account Refresh] Completed: ${accountsRefreshed} refreshed, ${accountsNotFound} not found in ${duration}ms`
        );

        if (errors.length > 0) {
          sendAlert(
            AlertSeverity.MEDIUM,
            "Account Refresh Completed with Errors",
            `Refreshed ${accountsRefreshed}/${total} accounts with ${errors.length} errors`,
            "account-refresh-worker",
            { errors: errors.slice(0, 5) }
          );
        }

        return { accountsRefreshed, accountsNotFound, duration, errors };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[Account Refresh] Job failed:`, err);

        sendAlert(
          AlertSeverity.HIGH,
          "Account Refresh Job Failed",
          errorMsg,
          "account-refresh-worker",
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

  worker.on("completed", (job, result) => {
    console.log(`[Account Refresh] Job ${job.id} completed`);
    notifyJobCompleted(QUEUE_NAMES.ACCOUNT_REFRESH, job.id, result as unknown as Record<string, unknown>);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Account Refresh] Job ${job?.id} failed:`, err);
    notifyJobFailed(QUEUE_NAMES.ACCOUNT_REFRESH, job?.id, err);
  });

  return worker;
}
