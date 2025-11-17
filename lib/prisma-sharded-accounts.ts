import { prisma } from "@/lib/prisma";
import { RIOT_REGIONS } from "@/constants/riot-regions";
import {
  validateTableName,
  validateRegion,
  escapeSqlIdentifier,
} from "@/lib/sql-sanitization";
import {
  getShardingBatchSize,
  getShardingRegionCacheSize,
  getShardingRegionCacheTTL,
} from "@/lib/sharding-config";

/**
 * Normalise le nom de région pour être utilisé comme nom de table
 * Remplace les caractères non alphanumériques par des underscores
 */
const normalizeRegionForTable = (region: string): string => {
  return region.toLowerCase().replace(/[^a-z0-9]/g, "_");
};

/**
 * Obtient le nom de la table pour une région donnée
 */
export const getLeagueAccountsTableName = (region: string): string => {
  // Valider la région avant de normaliser
  if (!validateRegion(region)) {
    throw new Error(`Invalid region: ${region}`);
  }
  const normalized = normalizeRegionForTable(region);
  const tableName = `league_accounts_${normalized}`;

  // Valider le nom de table final
  if (!validateTableName(tableName)) {
    throw new Error(`Invalid table name generated: ${tableName}`);
  }

  return tableName;
};

/**
 * Type pour un compte League of Legends (structure de base)
 */
export type LeagueAccountData = {
  id: string;
  puuid: string;
  riotGameName: string | null;
  riotTagLine: string | null;
  riotRegion: string;
  riotSummonerId: string | null;
  riotAccountId: string | null;
  summonerLevel: number | null;
  profileIconId: number | null;
  revisionDate: bigint | null;
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  avgKDA: number;
  mostPlayedChampion: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Helper pour obtenir le modèle Prisma dynamique pour une région
 * Utilise Prisma.$queryRaw pour les opérations sur les tables shardées
 */
export class ShardedLeagueAccounts {
  /**
   * Trouve un compte unique par PUUID dans la bonne table selon la région
   */
  static async findUniqueByPuuid(
    puuid: string,
    region: string
  ): Promise<LeagueAccountData | null> {
    // Valider la région avant de construire le nom de table
    if (!validateRegion(region)) {
      throw new Error(`Invalid region: ${region}`);
    }

    const tableName = getLeagueAccountsTableName(region);

    // Valider le nom de table
    if (!validateTableName(tableName)) {
      throw new Error(`Invalid table name: ${tableName}`);
    }

    // Utiliser des paramètres préparés pour éviter les injections SQL
    // Le nom de table est validé, donc on peut l'échapper en toute sécurité
    const escapedTableName = escapeSqlIdentifier(tableName);
    const result = await prisma.$queryRawUnsafe<LeagueAccountData[]>(
      `SELECT * FROM ${escapedTableName} WHERE "puuid" = $1 LIMIT 1`,
      puuid
    );

    return result[0] ?? null;
  }

  /**
   * Cache simple pour les régions trouvées par PUUID
   * En production, utiliser Redis pour un cache distribué
   */
  private static regionCache: Map<string, string> = new Map();
  private static regionCacheTimestamps: Map<string, number> = new Map();

  /**
   * Nettoie le cache si nécessaire (LRU simple)
   */
  private static cleanCacheIfNeeded(): void {
    const maxSize = getShardingRegionCacheSize();
    if (this.regionCache.size > maxSize) {
      // Supprimer les entrées les plus anciennes (simple LRU)
      const entries = Array.from(this.regionCacheTimestamps.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(0, this.regionCache.size - maxSize + 100); // Supprimer 100 entrées

      for (const [puuid] of entries) {
        this.regionCache.delete(puuid);
        this.regionCacheTimestamps.delete(puuid);
      }
    }
  }

  /**
   * Trouve un compte unique par PUUID en cherchant dans toutes les tables
   * Utilise des requêtes parallèles et un cache de région pour améliorer les performances
   *
   * @param puuid - Le PUUID du compte à rechercher
   * @param knownRegion - Région connue (optionnelle) pour éviter la recherche globale
   */
  static async findUniqueByPuuidGlobal(
    puuid: string,
    knownRegion?: string | null
  ): Promise<LeagueAccountData | null> {
    // Si on connaît la région, chercher directement
    if (knownRegion && validateRegion(knownRegion)) {
      const account = await this.findUniqueByPuuid(puuid, knownRegion);
      if (account) {
        // Mettre en cache la région trouvée
        this.regionCache.set(puuid, knownRegion);
        this.regionCacheTimestamps.set(puuid, Date.now());
        this.cleanCacheIfNeeded();
        return account;
      }
      // Si pas trouvé dans la région connue, continuer la recherche globale
    }

    // Vérifier le cache de région d'abord
    const cachedRegion = this.regionCache.get(puuid);
    const cacheTimestamp = this.regionCacheTimestamps.get(puuid);
    const cacheTTL = getShardingRegionCacheTTL();

    if (
      cachedRegion &&
      cacheTimestamp &&
      Date.now() - cacheTimestamp < cacheTTL
    ) {
      // Essayer directement la région en cache
      const account = await this.findUniqueByPuuid(puuid, cachedRegion);
      if (account) {
        return account;
      }
      // Si pas trouvé, le cache est invalide, continuer la recherche
    }

    // Utiliser la liste centralisée des régions
    const regions = [...RIOT_REGIONS];

    // Diviser en lots configurables pour éviter trop de requêtes simultanées
    const batchSize = getShardingBatchSize();
    for (let i = 0; i < regions.length; i += batchSize) {
      const batch = regions.slice(i, i + batchSize);

      // Faire les requêtes en parallèle
      const results = await Promise.allSettled(
        batch.map((region) => this.findUniqueByPuuid(puuid, region))
      );

      // Trouver le premier résultat valide
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.status === "fulfilled" && result.value) {
          // Mettre en cache la région trouvée
          const foundRegion = batch[j];
          this.regionCache.set(puuid, foundRegion);
          this.regionCacheTimestamps.set(puuid, Date.now());
          this.cleanCacheIfNeeded();

          return result.value;
        }
      }
    }

    return null;
  }

  /**
   * Upsert un compte dans la bonne table selon la région
   */
  static async upsert(data: {
    puuid: string;
    riotRegion: string;
    riotGameName?: string | null;
    riotTagLine?: string | null;
    riotSummonerId?: string | null;
    riotAccountId?: string | null;
    summonerLevel?: number | null;
    profileIconId?: number | null;
    revisionDate?: bigint | null;
    totalMatches?: number;
    totalWins?: number;
    totalLosses?: number;
    winRate?: number;
    avgKDA?: number;
    mostPlayedChampion?: string | null;
  }): Promise<LeagueAccountData> {
    const tableName = getLeagueAccountsTableName(data.riotRegion);
    const region = data.riotRegion;

    // Vérifier que le nom de table est sûr
    if (!/^[a-z0-9_]+$/.test(tableName.replace("league_accounts_", ""))) {
      throw new Error(`Invalid region name for table: ${region}`);
    }

    // Vérifier si le compte existe déjà
    const existing = await this.findUniqueByPuuid(data.puuid, region);

    if (existing) {
      // Mettre à jour seulement les champs fournis
      const updates: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (data.riotGameName !== undefined) {
        updates.push(`"riotGameName" = $${paramIndex++}`);
        values.push(data.riotGameName);
      }
      if (data.riotTagLine !== undefined) {
        updates.push(`"riotTagLine" = $${paramIndex++}`);
        values.push(data.riotTagLine);
      }
      if (data.riotSummonerId !== undefined) {
        updates.push(`"riotSummonerId" = $${paramIndex++}`);
        values.push(data.riotSummonerId);
      }
      if (data.riotAccountId !== undefined) {
        updates.push(`"riotAccountId" = $${paramIndex++}`);
        values.push(data.riotAccountId);
      }
      if (data.summonerLevel !== undefined) {
        updates.push(`"summonerLevel" = $${paramIndex++}`);
        values.push(data.summonerLevel);
      }
      if (data.profileIconId !== undefined) {
        updates.push(`"profileIconId" = $${paramIndex++}`);
        values.push(data.profileIconId);
      }
      if (data.revisionDate !== undefined) {
        updates.push(`"revisionDate" = $${paramIndex++}`);
        values.push(data.revisionDate);
      }
      if (data.totalMatches !== undefined) {
        updates.push(`"totalMatches" = $${paramIndex++}`);
        values.push(data.totalMatches);
      }
      if (data.totalWins !== undefined) {
        updates.push(`"totalWins" = $${paramIndex++}`);
        values.push(data.totalWins);
      }
      if (data.totalLosses !== undefined) {
        updates.push(`"totalLosses" = $${paramIndex++}`);
        values.push(data.totalLosses);
      }
      if (data.winRate !== undefined) {
        updates.push(`"winRate" = $${paramIndex++}`);
        values.push(data.winRate);
      }
      if (data.avgKDA !== undefined) {
        updates.push(`"avgKDA" = $${paramIndex++}`);
        values.push(data.avgKDA);
      }
      if (data.mostPlayedChampion !== undefined) {
        updates.push(`"mostPlayedChampion" = $${paramIndex++}`);
        values.push(data.mostPlayedChampion);
      }

      if (updates.length > 0) {
        updates.push(`"updatedAt" = NOW()`);
        values.push(data.puuid);

        await prisma.$executeRawUnsafe(
          `UPDATE "${tableName}" SET ${updates.join(
            ", "
          )} WHERE "puuid" = $${paramIndex}`,
          ...values
        );

        const updated = await this.findUniqueByPuuid(data.puuid, region);
        if (updated) return updated;
      }

      return existing;
    } else {
      // Créer - utiliser Prisma.$queryRawUnsafe avec INSERT
      const id = `acc_${data.puuid.slice(0, 12)}_${Date.now()}`;

      await prisma.$executeRawUnsafe(
        `INSERT INTO "${tableName}" (
          "id", "puuid", "riotRegion", "riotGameName", "riotTagLine", 
          "riotSummonerId", "riotAccountId", "summonerLevel", "profileIconId", 
          "revisionDate", "totalMatches", "totalWins", "totalLosses", 
          "winRate", "avgKDA", "mostPlayedChampion", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()
        )`,
        id,
        data.puuid,
        region,
        data.riotGameName ?? null,
        data.riotTagLine ?? null,
        data.riotSummonerId ?? null,
        data.riotAccountId ?? null,
        data.summonerLevel ?? null,
        data.profileIconId ?? null,
        data.revisionDate ?? null,
        data.totalMatches ?? 0,
        data.totalWins ?? 0,
        data.totalLosses ?? 0,
        data.winRate ?? 0,
        data.avgKDA ?? 0,
        data.mostPlayedChampion ?? null
      );

      const created = await this.findUniqueByPuuid(data.puuid, region);
      if (!created) {
        throw new Error(`Failed to create account in ${tableName}`);
      }
      return created;
    }
  }

  /**
   * Trouve plusieurs comptes par PUUIDs dans une région
   */
  static async findManyByPuuids(
    puuids: string[],
    region: string
  ): Promise<LeagueAccountData[]> {
    if (puuids.length === 0) return [];

    const tableName = getLeagueAccountsTableName(region);

    // Vérifier que le nom de table est sûr
    if (!/^[a-z0-9_]+$/.test(tableName.replace("league_accounts_", ""))) {
      throw new Error(`Invalid region name for table: ${region}`);
    }

    // Utiliser Prisma.join pour créer une liste sécurisée de puuids
    const placeholders = puuids.map((_, i) => `$${i + 1}`).join(", ");

    const result = await prisma.$queryRawUnsafe<LeagueAccountData[]>(
      `SELECT * FROM "${tableName}" WHERE "puuid" IN (${placeholders})`,
      ...puuids
    );

    return result;
  }

  /**
   * Trouve plusieurs comptes par PUUIDs dans toutes les régions
   * Utilise des requêtes parallèles pour améliorer les performances
   */
  static async findManyByPuuidsGlobal(
    puuids: string[]
  ): Promise<Map<string, LeagueAccountData>> {
    const result = new Map<string, LeagueAccountData>();

    if (puuids.length === 0) return result;

    // Utiliser la liste centralisée des régions
    const regions = [...RIOT_REGIONS];

    // Diviser en lots configurables pour éviter trop de requêtes simultanées
    const batchSize = getShardingBatchSize();
    for (let i = 0; i < regions.length; i += batchSize) {
      const batch = regions.slice(i, i + batchSize);

      // Faire les requêtes en parallèle
      const results = await Promise.allSettled(
        batch.map((region) => this.findManyByPuuids(puuids, region))
      );

      // Collecter tous les résultats
      for (const accountResult of results) {
        if (accountResult.status === "fulfilled") {
          for (const account of accountResult.value) {
            if (!result.has(account.puuid)) {
              result.set(account.puuid, account);
            }
          }
        }
      }

      // Si on a trouvé tous les comptes, on peut arrêter
      if (result.size === puuids.length) break;
    }

    return result;
  }

  /**
   * Supprime un compte par PUUID dans la bonne table selon la région
   */
  static async deleteByPuuid(puuid: string, region: string): Promise<boolean> {
    const tableName = getLeagueAccountsTableName(region);

    // Vérifier que le nom de table est sûr
    if (!/^[a-z0-9_]+$/.test(tableName.replace("league_accounts_", ""))) {
      throw new Error(`Invalid region name for table: ${region}`);
    }

    const result = await prisma.$executeRawUnsafe(
      `DELETE FROM "${tableName}" WHERE "puuid" = $1`,
      puuid
    );

    return (result as number) > 0;
  }
}
