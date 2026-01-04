/**
 * Cache en mémoire simple et efficace
 * Pas besoin de Redis pour une seule instance
 */

import { createLogger } from "./logger";

const logger = createLogger("cache");

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Nettoyer les entrées expirées toutes les minutes
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of this.store.entries()) {
          if (entry.expiresAt < now) {
            this.store.delete(key);
            cleaned++;
          }
        }
        if (cleaned > 0) {
          logger.debug("Cache cleanup", { cleaned, remaining: this.store.size });
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

  size(): number {
    return this.store.size;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Singleton instance
const memoryCache = new MemoryCache();

export const cache = memoryCache;

/**
 * Cache avec TTL en millisecondes
 */
export const getOrSetCache = async <T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> => {
  const cached = memoryCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const value = await fetcher();
  memoryCache.set(key, value, ttlMs);
  return value;
};

/**
 * Invalide une clé du cache
 */
export const invalidateCache = (key: string): void => {
  memoryCache.delete(key);
};

/**
 * Invalide toutes les clés qui commencent par un préfixe
 */
export const invalidateCachePrefix = (prefix: string): void => {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
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
