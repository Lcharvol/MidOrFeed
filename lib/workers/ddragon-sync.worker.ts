import { Worker, Job } from "bullmq";
import { getRedisConnection } from "../redis";
import { QUEUE_NAMES } from "../queues";
import { prisma } from "../prisma";
import { sendAlert, AlertSeverity } from "../alerting";
import type {
  DDragonSyncJobData,
  DDragonSyncJobResult,
  JobProgress,
} from "../queues/types";

const DDRAGON_BASE = "https://ddragon.leagueoflegends.com";

type ChampionData = {
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: {
    attack: number;
    defense: number;
    magic: number;
    difficulty: number;
  };
  stats: {
    hp: number;
    hpperlevel: number;
    mp: number;
    mpperlevel: number;
    movespeed: number;
    armor: number;
    armorperlevel: number;
    spellblock: number;
    spellblockperlevel: number;
    attackrange: number;
    hpregen: number;
    hpregenperlevel: number;
    mpregen: number;
    mpregenperlevel: number;
    crit: number;
    critperlevel: number;
    attackdamage: number;
    attackdamageperlevel: number;
    attackspeed: number;
    attackspeedperlevel: number;
  };
};

type ItemData = {
  name: string;
  description: string;
  plaintext: string;
  image: { full: string };
  gold: { total: number; base: number; sell: number };
};

/**
 * DDragon Sync Worker
 * Updates champions, items, and versions from DDragon CDN
 */
export function createDDragonSyncWorker() {
  const worker = new Worker<DDragonSyncJobData, DDragonSyncJobResult>(
    QUEUE_NAMES.DDRAGON_SYNC,
    async (job: Job<DDragonSyncJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];
      let championsUpdated = 0;
      let itemsUpdated = 0;
      let newVersion: string | null = null;

      try {
        console.log(`[DDragon Sync] Starting job ${job.id}`);

        const { force = false, resources = ["champions", "items", "versions"] } = job.data;

        // Step 1: Get latest version
        const progress1: JobProgress = {
          current: 1,
          total: 4,
          message: "Fetching latest version",
        };
        await job.updateProgress(progress1);

        const versionsRes = await fetch(`${DDRAGON_BASE}/api/versions.json`);
        const versions = (await versionsRes.json()) as string[];
        const latestVersion = versions[0];

        // Check if update is needed
        const currentVersion = await prisma.gameVersion.findFirst({
          where: { isCurrent: true },
        });

        if (!force && currentVersion?.version === latestVersion) {
          console.log(`[DDragon Sync] Already up to date (${latestVersion})`);
          return {
            championsUpdated: 0,
            itemsUpdated: 0,
            newVersion: null,
            duration: Date.now() - startTime,
            errors: [],
          };
        }

        newVersion = latestVersion;
        console.log(`[DDragon Sync] Updating to version ${latestVersion}`);

        // Step 2: Update champions
        if (resources.includes("champions")) {
          const progress2: JobProgress = {
            current: 2,
            total: 4,
            message: "Syncing champions",
          };
          await job.updateProgress(progress2);

          try {
            const championsRes = await fetch(
              `${DDRAGON_BASE}/cdn/${latestVersion}/data/en_US/champion.json`
            );
            const championsData = (await championsRes.json()) as {
              data: Record<string, ChampionData>;
            };

            for (const [championId, champion] of Object.entries(championsData.data)) {
              await prisma.champion.upsert({
                where: { championId },
                create: {
                  championId,
                  championKey: parseInt(champion.key, 10),
                  name: champion.name,
                  title: champion.title,
                  blurb: champion.blurb,
                  attack: champion.info.attack,
                  defense: champion.info.defense,
                  magic: champion.info.magic,
                  difficulty: champion.info.difficulty,
                  hp: champion.stats.hp,
                  hpPerLevel: champion.stats.hpperlevel,
                  mp: champion.stats.mp,
                  mpPerLevel: champion.stats.mpperlevel,
                  moveSpeed: champion.stats.movespeed,
                  armor: champion.stats.armor,
                  armorPerLevel: champion.stats.armorperlevel,
                  spellBlock: champion.stats.spellblock,
                  spellBlockPerLevel: champion.stats.spellblockperlevel,
                  attackRange: champion.stats.attackrange,
                  hpRegen: champion.stats.hpregen,
                  hpRegenPerLevel: champion.stats.hpregenperlevel,
                  mpRegen: champion.stats.mpregen,
                  mpRegenPerLevel: champion.stats.mpregenperlevel,
                  crit: champion.stats.crit,
                  critPerLevel: champion.stats.critperlevel,
                  attackDamage: champion.stats.attackdamage,
                  attackDamagePerLevel: champion.stats.attackdamageperlevel,
                  attackSpeed: champion.stats.attackspeed,
                  attackSpeedPerLevel: champion.stats.attackspeedperlevel,
                },
                update: {
                  name: champion.name,
                  title: champion.title,
                  blurb: champion.blurb,
                  attack: champion.info.attack,
                  defense: champion.info.defense,
                  magic: champion.info.magic,
                  difficulty: champion.info.difficulty,
                  hp: champion.stats.hp,
                  hpPerLevel: champion.stats.hpperlevel,
                  mp: champion.stats.mp,
                  mpPerLevel: champion.stats.mpperlevel,
                  moveSpeed: champion.stats.movespeed,
                  armor: champion.stats.armor,
                  armorPerLevel: champion.stats.armorperlevel,
                  spellBlock: champion.stats.spellblock,
                  spellBlockPerLevel: champion.stats.spellblockperlevel,
                  attackRange: champion.stats.attackrange,
                  hpRegen: champion.stats.hpregen,
                  hpRegenPerLevel: champion.stats.hpregenperlevel,
                  mpRegen: champion.stats.mpregen,
                  mpRegenPerLevel: champion.stats.mpregenperlevel,
                  crit: champion.stats.crit,
                  critPerLevel: champion.stats.critperlevel,
                  attackDamage: champion.stats.attackdamage,
                  attackDamagePerLevel: champion.stats.attackdamageperlevel,
                  attackSpeed: champion.stats.attackspeed,
                  attackSpeedPerLevel: champion.stats.attackspeedperlevel,
                },
              });
              championsUpdated++;
            }

            console.log(`[DDragon Sync] Updated ${championsUpdated} champions`);
          } catch (err) {
            errors.push(`Champions sync failed: ${err instanceof Error ? err.message : "Unknown"}`);
          }
        }

        // Step 3: Update items
        if (resources.includes("items")) {
          const progress3: JobProgress = {
            current: 3,
            total: 4,
            message: "Syncing items",
          };
          await job.updateProgress(progress3);

          try {
            const itemsRes = await fetch(
              `${DDRAGON_BASE}/cdn/${latestVersion}/data/en_US/item.json`
            );
            const itemsData = (await itemsRes.json()) as {
              data: Record<string, ItemData>;
            };

            for (const [itemId, item] of Object.entries(itemsData.data)) {
              await prisma.item.upsert({
                where: { itemId },
                create: {
                  itemId,
                  name: item.name,
                  description: item.description,
                  plaintext: item.plaintext,
                  image: item.image.full,
                  gold: JSON.stringify(item.gold),
                },
                update: {
                  name: item.name,
                  description: item.description,
                  plaintext: item.plaintext,
                  image: item.image.full,
                  gold: JSON.stringify(item.gold),
                },
              });
              itemsUpdated++;
            }

            console.log(`[DDragon Sync] Updated ${itemsUpdated} items`);
          } catch (err) {
            errors.push(`Items sync failed: ${err instanceof Error ? err.message : "Unknown"}`);
          }
        }

        // Step 4: Update version
        if (resources.includes("versions")) {
          const progress4: JobProgress = {
            current: 4,
            total: 4,
            message: "Updating version",
          };
          await job.updateProgress(progress4);

          // Set all versions to not current
          await prisma.gameVersion.updateMany({
            data: { isCurrent: false },
          });

          // Upsert new version
          await prisma.gameVersion.upsert({
            where: { version: latestVersion },
            create: { version: latestVersion, isCurrent: true },
            update: { isCurrent: true },
          });
        }

        const duration = Date.now() - startTime;
        console.log(
          `[DDragon Sync] Completed: ${championsUpdated} champions, ${itemsUpdated} items, version ${newVersion} in ${duration}ms`
        );

        if (errors.length > 0) {
          sendAlert(
            AlertSeverity.MEDIUM,
            "DDragon Sync Completed with Errors",
            `Updated to ${newVersion} with ${errors.length} errors`,
            "ddragon-sync-worker",
            { errors }
          );
        }

        return { championsUpdated, itemsUpdated, newVersion, duration, errors };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[DDragon Sync] Job failed:`, err);

        sendAlert(
          AlertSeverity.HIGH,
          "DDragon Sync Job Failed",
          errorMsg,
          "ddragon-sync-worker",
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
    console.log(`[DDragon Sync] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[DDragon Sync] Job ${job?.id} failed:`, err);
  });

  return worker;
}
