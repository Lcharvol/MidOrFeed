import { Worker, Job } from "bullmq";
import { getRedisConnection } from "../redis";
import { QUEUE_NAMES } from "../queues";
import { prisma } from "../prisma";
import { sendAlert, AlertSeverity } from "../alerting";
import { notifyJobCompleted, notifyJobFailed } from "./job-notifications";
import type {
  CompositionJobData,
  CompositionJobResult,
  JobProgress,
} from "../queues/types";

const ROLES = ["top", "jungle", "mid", "adc", "support"] as const;
type Role = (typeof ROLES)[number];

/**
 * Composition Generation Worker
 * Generates champion pick suggestions based on team composition analysis
 */
export function createCompositionWorker() {
  const worker = new Worker<CompositionJobData, CompositionJobResult>(
    QUEUE_NAMES.COMPOSITIONS,
    async (job: Job<CompositionJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];
      let suggestionsGenerated = 0;

      try {
        console.log(`[Compositions] Starting job ${job.id}`);

        const rolesToProcess = job.data.roles || [...ROLES];
        const minSampleSize = job.data.minSampleSize || 20;
        const total = rolesToProcess.length;

        // Clear existing AI-generated suggestions
        await prisma.compositionSuggestion.deleteMany({
          where: { userId: null },
        });

        for (let i = 0; i < rolesToProcess.length; i++) {
          const role = rolesToProcess[i];

          try {
            const count = await generateSuggestionsForRole(role, minSampleSize);
            suggestionsGenerated += count;

            const progress: JobProgress = {
              current: i + 1,
              total,
              message: `Generated ${count} suggestions for ${role} (${i + 1}/${total})`,
            };
            await job.updateProgress(progress);
          } catch (err) {
            const errorMsg = `Failed to generate suggestions for ${role}: ${
              err instanceof Error ? err.message : "Unknown error"
            }`;
            errors.push(errorMsg);
            console.error(`[Compositions] ${errorMsg}`);
          }
        }

        const duration = Date.now() - startTime;
        console.log(
          `[Compositions] Completed: ${suggestionsGenerated} suggestions in ${duration}ms`
        );

        if (errors.length > 0) {
          sendAlert(
            AlertSeverity.MEDIUM,
            "Composition Generation Completed with Errors",
            `Generated ${suggestionsGenerated} suggestions with ${errors.length} errors`,
            "composition-worker",
            { errors }
          );
        }

        return { suggestionsGenerated, duration, errors };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[Compositions] Job failed:`, err);

        sendAlert(
          AlertSeverity.HIGH,
          "Composition Generation Failed",
          errorMsg,
          "composition-worker"
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
    console.log(`[Compositions] Job ${job.id} completed`);
    notifyJobCompleted(QUEUE_NAMES.COMPOSITIONS, job.id, result as unknown as Record<string, unknown>);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Compositions] Job ${job?.id} failed:`, err);
    notifyJobFailed(QUEUE_NAMES.COMPOSITIONS, job?.id, err);
  });

  return worker;
}

/**
 * Generate suggestions for a specific role
 */
async function generateSuggestionsForRole(
  role: Role,
  minSampleSize: number
): Promise<number> {
  // Map role to position values used in match data
  const positionMap: Record<Role, string[]> = {
    top: ["TOP", "top", "SOLO"],
    jungle: ["JUNGLE", "jungle", "NONE"],
    mid: ["MIDDLE", "mid", "MID"],
    adc: ["BOTTOM", "bottom", "ADC", "adc"],
    support: ["UTILITY", "utility", "SUPPORT", "support"],
  };

  const positions = positionMap[role];

  // Find top performing champions for this role
  const championPerformance = await prisma.$queryRaw<
    Array<{
      championId: string;
      totalGames: bigint;
      wins: bigint;
      avgKDA: number;
    }>
  >`
    SELECT
      "championId",
      COUNT(*) as "totalGames",
      SUM(CASE WHEN win THEN 1 ELSE 0 END) as wins,
      AVG(CASE WHEN deaths > 0 THEN (kills + assists)::float / deaths ELSE (kills + assists)::float END) as "avgKDA"
    FROM match_participants
    WHERE (role = ANY(${positions}) OR lane = ANY(${positions}))
    GROUP BY "championId"
    HAVING COUNT(*) >= ${minSampleSize}
    ORDER BY
      SUM(CASE WHEN win THEN 1 ELSE 0 END)::float / COUNT(*) DESC,
      COUNT(*) DESC
    LIMIT 10
  `;

  let count = 0;

  for (const champ of championPerformance) {
    const totalGames = Number(champ.totalGames);
    const wins = Number(champ.wins);
    const winRate = wins / totalGames;
    const avgKDA = champ.avgKDA;

    // Find common ally champions (synergies)
    const synergies = await findSynergies(champ.championId, positions);

    // Calculate confidence based on sample size and win rate
    const sampleConfidence = Math.min(totalGames / 100, 1);
    const winRateConfidence = winRate > 0.5 ? (winRate - 0.5) * 2 : 0;
    const confidence = 0.6 * sampleConfidence + 0.4 * winRateConfidence;

    // Generate reasoning
    const reasoning = generateReasoning(champ.championId, winRate, avgKDA, totalGames, synergies);

    // Get champion stats for additional info
    const championStats = await prisma.championStats.findUnique({
      where: { championId: champ.championId },
    });

    await prisma.compositionSuggestion.create({
      data: {
        userId: null, // AI-generated
        role,
        suggestedChampion: champ.championId,
        teamChampions: JSON.stringify(synergies.slice(0, 4).map((s) => s.championId)),
        confidence,
        reasoning,
        strengths: championStats
          ? `Win rate: ${(winRate * 100).toFixed(1)}%, KDA moyen: ${avgKDA.toFixed(2)}`
          : null,
        weaknesses: championStats?.weakAgainst
          ? `Difficile contre: ${(championStats.weakAgainst as Array<{ championId: string }>)
              .slice(0, 3)
              .map((c) => c.championId)
              .join(", ")}`
          : null,
        playstyle: getPlaystyleDescription(role, avgKDA, winRate),
      },
    });

    count++;
  }

  return count;
}

/**
 * Find champions that synergize well with the given champion
 */
async function findSynergies(
  championId: string,
  positions: string[]
): Promise<Array<{ championId: string; winRate: number; games: number }>> {
  const synergies = await prisma.$queryRaw<
    Array<{
      allyChampionId: string;
      games: bigint;
      wins: bigint;
    }>
  >`
    SELECT
      ally."championId" as "allyChampionId",
      COUNT(*) as games,
      SUM(CASE WHEN mp.win THEN 1 ELSE 0 END) as wins
    FROM match_participants mp
    INNER JOIN match_participants ally
      ON mp."matchId" = ally."matchId"
      AND mp."teamId" = ally."teamId"
      AND mp.id != ally.id
    WHERE mp."championId" = ${championId}
      AND (mp.role = ANY(${positions}) OR mp.lane = ANY(${positions}))
    GROUP BY ally."championId"
    HAVING COUNT(*) >= 10
    ORDER BY SUM(CASE WHEN mp.win THEN 1 ELSE 0 END)::float / COUNT(*) DESC
    LIMIT 10
  `;

  return synergies.map((s) => ({
    championId: s.allyChampionId,
    winRate: Number(s.wins) / Number(s.games),
    games: Number(s.games),
  }));
}

/**
 * Generate human-readable reasoning for the suggestion
 */
function generateReasoning(
  championId: string,
  winRate: number,
  avgKDA: number,
  totalGames: number,
  synergies: Array<{ championId: string; winRate: number }>
): string {
  const parts: string[] = [];

  // Win rate assessment
  if (winRate >= 0.55) {
    parts.push(`Excellent performance avec ${(winRate * 100).toFixed(1)}% de victoires`);
  } else if (winRate >= 0.50) {
    parts.push(`Bonne performance avec ${(winRate * 100).toFixed(1)}% de victoires`);
  } else {
    parts.push(`Performance correcte avec ${(winRate * 100).toFixed(1)}% de victoires`);
  }

  // KDA assessment
  if (avgKDA >= 3.5) {
    parts.push(`Excellente capacité à rester en vie (KDA: ${avgKDA.toFixed(2)})`);
  } else if (avgKDA >= 2.5) {
    parts.push(`Bon ratio KDA de ${avgKDA.toFixed(2)}`);
  }

  // Sample size credibility
  if (totalGames >= 100) {
    parts.push(`Données fiables basées sur ${totalGames} parties`);
  } else if (totalGames >= 50) {
    parts.push(`Basé sur ${totalGames} parties analysées`);
  }

  // Synergies
  if (synergies.length > 0 && synergies[0].winRate >= 0.55) {
    parts.push(`Synergie forte avec certains champions alliés`);
  }

  return parts.join(". ") + ".";
}

/**
 * Get playstyle description based on stats
 */
function getPlaystyleDescription(
  role: Role,
  avgKDA: number,
  winRate: number
): string {
  const roleDescriptions: Record<Role, string> = {
    top: "Lane isolée, focus sur les duels et le split push",
    jungle: "Contrôle de la carte, ganks et objectifs",
    mid: "Roaming et impact sur les autres lanes",
    adc: "Farming intensif et damage dealing en teamfight",
    support: "Protection des alliés et contrôle de vision",
  };

  let style = roleDescriptions[role];

  if (avgKDA >= 3.5) {
    style += ". Style de jeu sécurisé avec peu de morts.";
  } else if (winRate >= 0.55) {
    style += ". Style agressif efficace pour gagner les parties.";
  }

  return style;
}
