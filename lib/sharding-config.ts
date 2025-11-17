import { getEnv } from "./env";

/**
 * Configuration pour l'optimisation du sharding
 */

/**
 * Taille du batch pour les requêtes parallèles
 * Peut être configurée via la variable d'environnement SHARDING_BATCH_SIZE
 * Défaut: 4 (équilibré entre performance et charge)
 */
export const getShardingBatchSize = (): number => {
  const env = getEnv();
  const batchSize = process.env.SHARDING_BATCH_SIZE
    ? parseInt(process.env.SHARDING_BATCH_SIZE, 10)
    : 4;

  // Valider que la taille est raisonnable (entre 1 et 16)
  if (batchSize < 1 || batchSize > 16) {
    console.warn(
      `SHARDING_BATCH_SIZE invalide (${batchSize}), utilisation de la valeur par défaut (4)`
    );
    return 4;
  }

  return batchSize;
};

/**
 * Taille du batch pour les requêtes de comptage
 * Peut être configurée via la variable d'environnement SHARDING_COUNT_BATCH_SIZE
 * Défaut: 8 (pour les requêtes de comptage, on peut être plus agressif)
 */
export const getShardingCountBatchSize = (): number => {
  const batchSize = process.env.SHARDING_COUNT_BATCH_SIZE
    ? parseInt(process.env.SHARDING_COUNT_BATCH_SIZE, 10)
    : 8;

  // Valider que la taille est raisonnable (entre 1 et 16)
  if (batchSize < 1 || batchSize > 16) {
    console.warn(
      `SHARDING_COUNT_BATCH_SIZE invalide (${batchSize}), utilisation de la valeur par défaut (8)`
    );
    return 8;
  }

  return batchSize;
};

/**
 * Taille maximale du cache de région
 * Peut être configurée via la variable d'environnement SHARDING_REGION_CACHE_SIZE
 * Défaut: 10000 (10k entrées)
 */
export const getShardingRegionCacheSize = (): number => {
  const cacheSize = process.env.SHARDING_REGION_CACHE_SIZE
    ? parseInt(process.env.SHARDING_REGION_CACHE_SIZE, 10)
    : 10000;

  // Valider que la taille est raisonnable (entre 100 et 1000000)
  if (cacheSize < 100 || cacheSize > 1000000) {
    console.warn(
      `SHARDING_REGION_CACHE_SIZE invalide (${cacheSize}), utilisation de la valeur par défaut (10000)`
    );
    return 10000;
  }

  return cacheSize;
};

/**
 * TTL du cache de région en millisecondes
 * Peut être configurée via la variable d'environnement SHARDING_REGION_CACHE_TTL_MS
 * Défaut: 24 heures (86400000 ms)
 */
export const getShardingRegionCacheTTL = (): number => {
  const ttl = process.env.SHARDING_REGION_CACHE_TTL_MS
    ? parseInt(process.env.SHARDING_REGION_CACHE_TTL_MS, 10)
    : 24 * 60 * 60 * 1000; // 24 heures

  // Valider que le TTL est raisonnable (entre 1 heure et 7 jours)
  if (ttl < 3600000 || ttl > 7 * 24 * 60 * 60 * 1000) {
    console.warn(
      `SHARDING_REGION_CACHE_TTL_MS invalide (${ttl}), utilisation de la valeur par défaut (24h)`
    );
    return 24 * 60 * 60 * 1000;
  }

  return ttl;
};
