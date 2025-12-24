/**
 * Cache simple en mémoire avec TTL (Time To Live)
 * En production, utiliser Redis ou un autre cache distribué pour les instances multiples
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Nettoyer les entrées expirées toutes les minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (entry.expiresAt < now) {
          this.store.delete(key);
        }
      }
    }, 60000); // 1 minute
  }

  /**
   * Récupère une valeur du cache
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    // Vérifier si l'entrée a expiré
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Stocke une valeur dans le cache avec un TTL en millisecondes
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Supprime une valeur du cache
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Vide le cache
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Détruit le cache et arrête le cleanup
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Instance globale du cache
export const cache = new MemoryCache();

/**
 * Cache avec TTL en millisecondes
 * @param key Clé du cache
 * @param ttlMs Durée de vie en millisecondes
 * @param fetcher Fonction pour récupérer la valeur si elle n'est pas en cache
 * @returns Valeur du cache ou résultat du fetcher
 */
export const getOrSetCache = async <T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> => {
  // Vérifier le cache
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Récupérer la valeur
  const value = await fetcher();

  // Mettre en cache
  cache.set(key, value, ttlMs);

  return value;
};

/**
 * Invalide une clé du cache
 */
export const invalidateCache = (key: string): void => {
  cache.delete(key);
};

/**
 * Invalide toutes les clés qui commencent par un préfixe
 */
export const invalidateCachePrefix = (prefix: string): void => {
  for (const key of cache["store"].keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
};

/**
 * Vérifie si une clé existe dans le cache
 */
export const hasCache = (key: string): boolean => {
  return cache.get(key) !== null;
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

