import { Job } from "pg-boss";
import { registerWorker, QUEUE_NAMES, updateJobProgress } from "../job-queue";
import { prisma } from "../prisma";
import { sendAlert, AlertSeverity } from "../alerting";
import { createLogger } from "../logger";
import {
  generateCompositionReasoning,
  type CompositionAnalysisInput,
} from "../ai/composition-analysis";
import type {
  CompositionJobData,
  CompositionJobResult,
} from "../queues/types";

const logger = createLogger("composition-worker");

const ROLES = ["top", "jungle", "mid", "adc", "support"] as const;
type Role = (typeof ROLES)[number];

// Role pairs for synergy analysis (expanded for better coverage)
const ROLE_SYNERGY_PAIRS: Record<Role, Role[]> = {
  top: ["jungle", "mid"],
  jungle: ["mid", "top", "support"],
  mid: ["jungle", "top"],
  adc: ["support", "mid"],
  support: ["adc", "jungle"],
};

interface AdvancedMetrics {
  avgDamagePerMin: number;
  avgGoldPerMin: number;
  avgVisionPerMin: number;
}

interface CounterMatchup {
  championId: string;
  winRateAgainst: number;
  games: number;
}

interface RoleSynergy {
  championId: string;
  role: string;
  winRate: number;
  games: number;
}

/**
 * Composition Generation Worker
 * Generates champion pick suggestions based on team composition analysis
 */
export async function createCompositionWorker() {
  return registerWorker<CompositionJobData, CompositionJobResult>(
    QUEUE_NAMES.COMPOSITIONS,
    async (job: Job<CompositionJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];
      let suggestionsGenerated = 0;

      try {
        logger.info(`Starting job ${job.id}`);

        const rolesToProcess = job.data.roles || [...ROLES];
        const minSampleSize = job.data.minSampleSize || 20;

        // Collect all new suggestion IDs to atomically swap at the end
        const newSuggestionIds: string[] = [];

        for (let i = 0; i < rolesToProcess.length; i++) {
          const role = rolesToProcess[i] as Role;

          await updateJobProgress(job.id, {
            current: i,
            total: rolesToProcess.length,
            message: `Generating suggestions for ${role}`,
          });

          try {
            const ids = await generateSuggestionsForRole(role, minSampleSize);
            newSuggestionIds.push(...ids);
            suggestionsGenerated += ids.length;
          } catch (err) {
            const errorMsg = `Failed to generate suggestions for ${role}: ${
              err instanceof Error ? err.message : "Unknown error"
            }`;
            errors.push(errorMsg);
            logger.error(errorMsg);
          }
        }

        // Delete old AI-generated suggestions only after new ones are created
        if (newSuggestionIds.length > 0) {
          await prisma.compositionSuggestion.deleteMany({
            where: {
              userId: null,
              id: { notIn: newSuggestionIds },
            },
          });
        }

        const duration = Date.now() - startTime;
        logger.info(`Completed: ${suggestionsGenerated} suggestions in ${duration}ms`);

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
        logger.error(`Job failed: ${errorMsg}`);

        sendAlert(
          AlertSeverity.HIGH,
          "Composition Generation Failed",
          errorMsg,
          "composition-worker"
        );

        throw err;
      }
    }
  );
}

// Map role to position values used in match data
const POSITION_MAP: Record<Role, string[]> = {
  top: ["TOP", "top", "SOLO"],
  jungle: ["JUNGLE", "jungle", "NONE"],
  mid: ["MIDDLE", "mid", "MID"],
  adc: ["BOTTOM", "bottom", "ADC", "adc"],
  support: ["UTILITY", "utility", "SUPPORT", "support"],
};

// Role order matching ROLE_PRIORITY: [top, jungle, mid, adc, support]
const ROLE_ORDER: Role[] = ["top", "jungle", "mid", "adc", "support"];

/**
 * Build a full 5-champion team ordered by role (top, jungle, mid, adc, support).
 * The main champion is placed at its role, and for each remaining role,
 * the best synergy champion for that role is picked. Falls back to global
 * best performers for unfilled roles.
 */
async function buildFullTeam(
  mainChampionId: string,
  mainRole: Role,
  roleSynergies: Record<string, RoleSynergy[]>,
  allSynergies: Array<{ championId: string; winRate: number; games: number }>
): Promise<string[]> {
  const team: Record<Role, string> = {
    top: "",
    jungle: "",
    mid: "",
    adc: "",
    support: "",
  };

  // Place the main champion at its role
  team[mainRole] = mainChampionId;
  const usedChampions = new Set<string>([mainChampionId]);

  // For each remaining role, find the best champion from role synergies
  const remainingRoles = ROLE_ORDER.filter((r) => r !== mainRole);

  for (const role of remainingRoles) {
    const candidates = roleSynergies[role] ?? [];
    const best = candidates.find((c) => !usedChampions.has(c.championId));
    if (best) {
      team[role] = best.championId;
      usedChampions.add(best.championId);
    }
  }

  // Fill any remaining empty roles from general synergies
  for (const role of remainingRoles) {
    if (team[role]) continue;
    const best = allSynergies.find((s) => !usedChampions.has(s.championId));
    if (best) {
      team[role] = best.championId;
      usedChampions.add(best.championId);
    }
  }

  // Last resort: fill from global top performers for that role
  for (const role of remainingRoles) {
    if (team[role]) continue;
    const positions = POSITION_MAP[role];
    const fallback = await prisma.$queryRaw<Array<{ championId: string }>>`
      SELECT "championId"
      FROM match_participants
      WHERE (role = ANY(${positions}) OR lane = ANY(${positions}))
      GROUP BY "championId"
      HAVING COUNT(*) >= 10
      ORDER BY SUM(CASE WHEN win THEN 1 ELSE 0 END)::float / COUNT(*) DESC
      LIMIT 10
    `;
    const pick = fallback.find((f) => !usedChampions.has(f.championId));
    if (pick) {
      team[role] = pick.championId;
      usedChampions.add(pick.championId);
    }
  }

  return ROLE_ORDER.map((r) => team[r]);
}

/**
 * Generate suggestions for a specific role
 */
async function generateSuggestionsForRole(
  role: Role,
  minSampleSize: number
): Promise<string[]> {
  const positions = POSITION_MAP[role];

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

  const createdIds: string[] = [];

  for (const champ of championPerformance) {
    const totalGames = Number(champ.totalGames);
    const wins = Number(champ.wins);
    const winRate = wins / totalGames;
    const avgKDA = champ.avgKDA;

    // Find common ally champions (synergies)
    const synergies = await findSynergies(champ.championId, positions);

    // Calculate advanced metrics
    const metrics = await calculateAdvancedMetrics(champ.championId, positions);

    // Find counter matchups
    const counters = await findCounterMatchups(champ.championId, positions);

    // Find role-specific synergies
    const roleSynergies = await findRoleSynergies(champ.championId, role);

    // Calculate confidence based on sample size and win rate
    const sampleConfidence = Math.min(totalGames / 100, 1);
    const winRateConfidence = winRate > 0.5 ? (winRate - 0.5) * 2 : 0;
    const confidence = 0.6 * sampleConfidence + 0.4 * winRateConfidence;

    // Get champion name for AI reasoning
    const champion = await prisma.champion.findFirst({
      where: { championId: champ.championId },
      select: { name: true },
    });

    // Build full 5-champion team ordered by role
    const teamChampions = await buildFullTeam(
      champ.championId,
      role,
      roleSynergies,
      synergies
    );

    // Resolve champion names for the full team
    const teamNames = await Promise.all(
      ROLE_ORDER.map(async (r, i) => {
        const cid = teamChampions[i];
        if (!cid) return { role: r, championId: cid, name: cid };
        const c = await prisma.champion.findFirst({
          where: { championId: cid },
          select: { name: true },
        });
        return { role: r, championId: cid, name: c?.name ?? cid };
      })
    );

    // Prepare synergies for AI input (flatten role synergies)
    const allRoleSynergies: Array<{ championId: string; role: string; winRate: number }> = [];
    for (const [partnerRole, synergyList] of Object.entries(roleSynergies)) {
      for (const s of synergyList) {
        allRoleSynergies.push({
          championId: s.championId,
          role: partnerRole,
          winRate: s.winRate,
        });
      }
    }

    // Generate AI-powered reasoning with full team context
    const aiInput: CompositionAnalysisInput = {
      championId: champ.championId,
      championName: champion?.name,
      role,
      winRate,
      avgKDA,
      metrics,
      synergies: allRoleSynergies,
      counters: counters.map((c) => ({
        championId: c.championId,
        winRateAgainst: c.winRateAgainst,
      })),
      team: teamNames.map((t) => ({ championName: t.name, role: t.role })),
    };
    const aiResult = await generateCompositionReasoning(aiInput);

    // Generate basic reasoning as fallback for the main reasoning field
    const reasoning = generateReasoning(champ.championId, winRate, avgKDA, totalGames, synergies);

    const created = await prisma.compositionSuggestion.create({
      data: {
        userId: null, // AI-generated
        role,
        suggestedChampion: champ.championId,
        teamChampions: JSON.stringify(teamChampions.filter(Boolean)),
        confidence,
        reasoning: aiResult.reasoning || reasoning,
        strengths: aiResult.strengths || null,
        weaknesses: aiResult.weaknesses || null,
        playstyle: aiResult.playstyle || null,
        // Enhanced fields
        counters: JSON.stringify(counters),
        roleSynergies: JSON.stringify(roleSynergies),
        avgDamagePerMin: metrics.avgDamagePerMin,
        avgGoldPerMin: metrics.avgGoldPerMin,
        avgVisionPerMin: metrics.avgVisionPerMin,
        aiReasoning: aiResult.reasoning || null,
      },
    });

    createdIds.push(created.id);
  }

  return createdIds;
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
 * Calculate advanced metrics for a champion in a role
 */
async function calculateAdvancedMetrics(
  championId: string,
  positions: string[]
): Promise<AdvancedMetrics> {
  const metrics = await prisma.$queryRaw<
    Array<{
      avgDamagePerMin: number | null;
      avgGoldPerMin: number | null;
      avgVisionPerMin: number | null;
    }>
  >`
    SELECT
      AVG(mp."totalDamageDealtToChampions"::float / NULLIF(m."gameDuration" / 60.0, 0)) as "avgDamagePerMin",
      AVG(mp."goldEarned"::float / NULLIF(m."gameDuration" / 60.0, 0)) as "avgGoldPerMin",
      AVG(mp."visionScore"::float / NULLIF(m."gameDuration" / 60.0, 0)) as "avgVisionPerMin"
    FROM match_participants mp
    INNER JOIN matches m ON mp."matchId" = m.id
    WHERE mp."championId" = ${championId}
      AND (mp.role = ANY(${positions}) OR mp.lane = ANY(${positions}))
      AND m."gameDuration" > 300
  `;

  const result = metrics[0];
  return {
    avgDamagePerMin: result?.avgDamagePerMin ?? 0,
    avgGoldPerMin: result?.avgGoldPerMin ?? 0,
    avgVisionPerMin: result?.avgVisionPerMin ?? 0,
  };
}

/**
 * Find counter matchups - champions this pick is effective against
 */
async function findCounterMatchups(
  championId: string,
  positions: string[]
): Promise<CounterMatchup[]> {
  const matchups = await prisma.$queryRaw<
    Array<{
      enemyChampionId: string;
      games: bigint;
      wins: bigint;
    }>
  >`
    SELECT
      enemy."championId" as "enemyChampionId",
      COUNT(*) as games,
      SUM(CASE WHEN mp.win THEN 1 ELSE 0 END) as wins
    FROM match_participants mp
    INNER JOIN match_participants enemy
      ON mp."matchId" = enemy."matchId"
      AND mp."teamId" != enemy."teamId"
    WHERE mp."championId" = ${championId}
      AND (mp.role = ANY(${positions}) OR mp.lane = ANY(${positions}))
      AND (enemy.role = ANY(${positions}) OR enemy.lane = ANY(${positions}))
    GROUP BY enemy."championId"
    HAVING COUNT(*) >= 10
    ORDER BY SUM(CASE WHEN mp.win THEN 1 ELSE 0 END)::float / COUNT(*) DESC
    LIMIT 5
  `;

  return matchups.map((m) => ({
    championId: m.enemyChampionId,
    winRateAgainst: Number(m.wins) / Number(m.games),
    games: Number(m.games),
  }));
}

/**
 * Find role-specific synergies for all roles (needed to build full 5-champion teams)
 */
async function findRoleSynergies(
  championId: string,
  role: Role
): Promise<Record<string, RoleSynergy[]>> {
  const synergiesResult: Record<string, RoleSynergy[]> = {};
  // Query all roles except the main champion's role
  const partnerRoles = ROLES.filter((r) => r !== role);

  const myPositions = POSITION_MAP[role];

  for (const partnerRole of partnerRoles) {
    const partnerPositions = POSITION_MAP[partnerRole];

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
        AND (mp.role = ANY(${myPositions}) OR mp.lane = ANY(${myPositions}))
        AND (ally.role = ANY(${partnerPositions}) OR ally.lane = ANY(${partnerPositions}))
      GROUP BY ally."championId"
      HAVING COUNT(*) >= 10
      ORDER BY SUM(CASE WHEN mp.win THEN 1 ELSE 0 END)::float / COUNT(*) DESC
      LIMIT 5
    `;

    synergiesResult[partnerRole] = synergies.map((s) => ({
      championId: s.allyChampionId,
      role: partnerRole,
      winRate: Number(s.wins) / Number(s.games),
      games: Number(s.games),
    }));
  }

  return synergiesResult;
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

