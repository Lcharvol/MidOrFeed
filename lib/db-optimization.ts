import { prisma } from "./prisma";
import { recordTiming, measureTiming } from "./metrics";

/**
 * Optimisations et helpers pour les requêtes Prisma
 */

/**
 * Récupère un compte avec cache de région
 * Si on connaît la région, on évite de chercher dans toutes les régions
 */
export const getAccountWithRegionCache = async (
  puuid: string,
  knownRegion?: string | null
) => {
  const { ShardedLeagueAccounts } = await import("./prisma-sharded-accounts");

  // Si on connaît la région, chercher directement dans cette région
  if (knownRegion) {
    return measureTiming(
      "db.findUniqueByPuuid",
      () => ShardedLeagueAccounts.findUniqueByPuuid(puuid, knownRegion),
      { region: knownRegion, cached: "true" }
    );
  }

  // Sinon, chercher dans toutes les régions
  return measureTiming(
    "db.findUniqueByPuuidGlobal",
    () => ShardedLeagueAccounts.findUniqueByPuuidGlobal(puuid),
    { cached: "false" }
  );
};

/**
 * Wrapper Prisma avec métriques automatiques
 */
export const prismaWithMetrics = {
  /**
   * findUnique avec métriques
   */
  findUnique: async <T>(
    model: string,
    operation: () => Promise<T | null>
  ): Promise<T | null> => {
    return measureTiming(`db.${model}.findUnique`, operation);
  },

  /**
   * findMany avec métriques
   */
  findMany: async <T>(model: string, operation: () => Promise<T[]>): Promise<T[]> => {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    
    recordTiming(`db.${model}.findMany`, duration, {
      count: result.length.toString(),
    });
    
    return result;
  },

  /**
   * count avec métriques
   */
  count: async (model: string, operation: () => Promise<number>): Promise<number> => {
    return measureTiming(`db.${model}.count`, operation);
  },

  /**
   * createMany avec métriques
   */
  createMany: async <T>(
    model: string,
    operation: () => Promise<{ count: number }>
  ): Promise<{ count: number }> => {
    return measureTiming(`db.${model}.createMany`, operation);
  },

  /**
   * update avec métriques
   */
  update: async <T>(model: string, operation: () => Promise<T>): Promise<T> => {
    return measureTiming(`db.${model}.update`, operation);
  },
};

