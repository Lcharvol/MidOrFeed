/**
 * Cache hybride avec Redis comme backend principal et fallback sur mémoire
 * Redis est utilisé pour le cache distribué entre instances
 * Memory est utilisé comme fallback si Redis n'est pas disponible
 */

import { createLogger } from "./logger";

const logger = createLogger("cache");

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// ========================
// Memory Cache (fallback)
// ========================

class MemoryCache {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Nettoyer les entrées expirées toutes les minutes
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
          if (entry.expiresAt < now) {
            this.store.delete(key);
          }
        }
      }, 60000);
    }
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  keys(): IterableIterator<string> {
    return this.store.keys();
  }

  clear(): void {
    this.store.clear();
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// ========================
// Redis Cache
// ========================

let redisClient: import("ioredis").Redis | null = null;
let redisAvailable = false;

async function getRedisClient(): Promise<import("ioredis").Redis | null> {
  if (redisClient) {
    return redisClient;
  }

  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      return null;
    }

    const Redis = (await import("ioredis")).default;
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 100, 1000);
      },
    });

    await redisClient.connect();
    redisAvailable = true;
    logger.info("Redis cache connected");

    redisClient.on("error", () => {
      redisAvailable = false;
    });

    redisClient.on("ready", () => {
      redisAvailable = true;
    });

    return redisClient;
  } catch {
    logger.warn("Redis not available, using memory cache");
    return null;
  }
}

// ========================
// Hybrid Cache
// ========================

const memoryCache = new MemoryCache();

async function getFromRedis<T>(key: string): Promise<T | null> {
  if (!redisAvailable) return null;

  try {
    const client = await getRedisClient();
    if (!client) return null;

    const data = await client.get(`cache:${key}`);
    if (!data) return null;

    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

async function setInRedis<T>(key: string, value: T, ttlMs: number): Promise<void> {
  if (!redisAvailable) return;

  try {
    const client = await getRedisClient();
    if (!client) return;

    const ttlSeconds = Math.ceil(ttlMs / 1000);
    await client.setex(`cache:${key}`, ttlSeconds, JSON.stringify(value));
  } catch {
    // Silently fail - memory cache will be used
  }
}

async function deleteFromRedis(key: string): Promise<void> {
  if (!redisAvailable) return;

  try {
    const client = await getRedisClient();
    if (!client) return;

    await client.del(`cache:${key}`);
  } catch {
    // Silently fail
  }
}

async function deleteByPrefixFromRedis(prefix: string): Promise<void> {
  if (!redisAvailable) return;

  try {
    const client = await getRedisClient();
    if (!client) return;

    const keys = await client.keys(`cache:${prefix}*`);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch {
    // Silently fail
  }
}

// ========================
// Public API (unchanged)
// ========================

export const cache = memoryCache;

/**
 * Cache avec TTL en millisecondes
 * Utilise Redis si disponible, sinon fallback sur mémoire
 */
export const getOrSetCache = async <T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> => {
  // 1. Try Redis first
  const redisValue = await getFromRedis<T>(key);
  if (redisValue !== null) {
    // Also warm memory cache
    memoryCache.set(key, redisValue, ttlMs);
    return redisValue;
  }

  // 2. Try memory cache
  const memoryValue = memoryCache.get<T>(key);
  if (memoryValue !== null) {
    return memoryValue;
  }

  // 3. Fetch and cache
  const value = await fetcher();

  // Cache in both
  memoryCache.set(key, value, ttlMs);
  await setInRedis(key, value, ttlMs);

  return value;
};

/**
 * Invalide une clé du cache (Redis + mémoire)
 */
export const invalidateCache = (key: string): void => {
  memoryCache.delete(key);
  deleteFromRedis(key).catch(() => {});
};

/**
 * Invalide toutes les clés qui commencent par un préfixe
 */
export const invalidateCachePrefix = (prefix: string): void => {
  // Memory cache
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
  // Redis
  deleteByPrefixFromRedis(prefix).catch(() => {});
};

/**
 * Vérifie si une clé existe dans le cache
 */
export const hasCache = (key: string): boolean => {
  return memoryCache.get(key) !== null;
};

/**
 * Presets de TTL courants
 */
export const CacheTTL = {
  /** 1 minute */
  SHORT: 60 * 1000,
  /** 5 minutes */
  MEDIUM: 5 * 60 * 1000,
  /** 15 minutes */
  LONG: 15 * 60 * 1000,
  /** 1 heure */
  VERY_LONG: 60 * 60 * 1000,
  /** 24 heures */
  DAY: 24 * 60 * 60 * 1000,
} as const;
