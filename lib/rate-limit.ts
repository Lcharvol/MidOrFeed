import { NextRequest, NextResponse } from "next/server";
import Redis from "ioredis";
import { createLogger } from "@/lib/logger";

const logger = createLogger("rate-limit");

/**
 * Configuration du rate limiting
 */
interface RateLimitConfig {
  /**
   * Nombre de requêtes autorisées
   */
  limit: number;

  /**
   * Période en millisecondes
   */
  windowMs: number;

  /**
   * Message d'erreur personnalisé
   */
  message?: string;

  /**
   * Identifier unique pour le rate limiting (par défaut: IP)
   */
  identifier?: (request: NextRequest) => string | Promise<string>;
}

/**
 * Interface pour les stores de rate limiting
 */
interface RateLimitStore {
  get(key: string): Promise<{ count: number; resetTime: number } | null>;
  set(key: string, value: { count: number; resetTime: number }, ttlMs: number): Promise<void>;
  increment(key: string): Promise<number>;
}

/**
 * Store Redis pour le rate limiting distribué
 * Utilisé en production pour supporter plusieurs instances
 */
class RedisStore implements RateLimitStore {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    try {
      const data = await this.redis.get(`ratelimit:${key}`);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      logger.warn("Redis get error", { key, error: (error as Error).message });
      return null;
    }
  }

  async set(key: string, value: { count: number; resetTime: number }, ttlMs: number): Promise<void> {
    try {
      await this.redis.set(
        `ratelimit:${key}`,
        JSON.stringify(value),
        "PX",
        ttlMs
      );
    } catch (error) {
      logger.error("Redis set error", error as Error, { key });
    }
  }

  async increment(key: string): Promise<number> {
    try {
      return await this.redis.incr(`ratelimit:${key}`);
    } catch (error) {
      logger.warn("Redis increment error", { key, error: (error as Error).message });
      return 1;
    }
  }
}

/**
 * Store en mémoire pour le développement ou fallback
 */
class MemoryStore implements RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Nettoyer les entrées expirées toutes les minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.store.entries()) {
        if (value.resetTime < now) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: { count: number; resetTime: number }): Promise<void> {
    this.store.set(key, value);
  }

  async increment(key: string): Promise<number> {
    const record = this.store.get(key);
    if (record) {
      record.count++;
      return record.count;
    }
    return 1;
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Store global - utilise Redis en production si disponible
let store: RateLimitStore | null = null;
let redisClient: Redis | null = null;

/**
 * Initialise le store de rate limiting
 * Utilise Redis si REDIS_URL est configuré, sinon fallback sur mémoire
 */
const getStore = (): RateLimitStore => {
  if (store) return store;

  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    try {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        lazyConnect: true,
      });

      redisClient.on("error", (err) => {
        logger.error("Redis error, falling back to memory", err);
        // Fallback to memory store on Redis failure
        store = new MemoryStore();
      });

      store = new RedisStore(redisClient);
      logger.info("Using Redis store for distributed rate limiting");
    } catch (error) {
      logger.warn("Failed to connect to Redis, using memory store", { error: (error as Error).message });
      store = new MemoryStore();
    }
  } else {
    if (process.env.NODE_ENV === "production") {
      logger.warn("REDIS_URL not configured in production - rate limiting will not work across multiple instances");
    }
    store = new MemoryStore();
  }

  return store;
};

/**
 * Rate limiting middleware pour Next.js API Routes
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const rateLimitResponse = await rateLimit(request, {
 *     limit: 10,
 *     windowMs: 60000, // 1 minute
 *   });
 *   if (rateLimitResponse) return rateLimitResponse;
 *
 *   // Votre code ici...
 * }
 * ```
 */
export const rateLimit = async (
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> => {
  const {
    limit,
    windowMs,
    message = "Trop de requêtes, veuillez réessayer plus tard",
    identifier,
  } = config;

  // Identifier la requête (par défaut: IP depuis les headers)
  const id = identifier
    ? await identifier(request)
    : request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

  const key = `${id}:${windowMs}`;
  const now = Date.now();
  const rateLimitStore = getStore();

  // Récupérer ou initialiser le compteur
  const record = await rateLimitStore.get(key);

  if (!record || record.resetTime < now) {
    // Nouveau window ou window expiré
    await rateLimitStore.set(
      key,
      {
        count: 1,
        resetTime: now + windowMs,
      },
      windowMs
    );
    return null; // OK
  }

  if (record.count >= limit) {
    // Limite atteinte
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return NextResponse.json(
      {
        error: message,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(record.resetTime).toISOString(),
        },
      }
    );
  }

  // Incrémenter le compteur
  record.count++;
  await rateLimitStore.set(key, record, record.resetTime - now);

  return null; // OK
};

/**
 * Récupère les presets de rate limiting depuis les variables d'environnement
 * avec des valeurs par défaut raisonnables
 */
const getRateLimitConfig = () => {
  const env = process.env;

  return {
    auth: {
      limit: parseInt(env.RATE_LIMIT_AUTH_LIMIT || "5", 10),
      windowMs: parseInt(
        env.RATE_LIMIT_AUTH_WINDOW_MS || String(15 * 60 * 1000),
        10
      ),
    },
    api: {
      limit: parseInt(env.RATE_LIMIT_API_LIMIT || "100", 10),
      windowMs: parseInt(env.RATE_LIMIT_API_WINDOW_MS || String(60 * 1000), 10),
    },
    admin: {
      limit: parseInt(env.RATE_LIMIT_ADMIN_LIMIT || "50", 10),
      windowMs: parseInt(
        env.RATE_LIMIT_ADMIN_WINDOW_MS || String(60 * 1000),
        10
      ),
    },
  };
};

/**
 * Presets de rate limiting courants (configurables via env vars)
 */
export const rateLimitPresets = {
  /**
   * Rate limiting strict pour l'authentification
   * Configurable via RATE_LIMIT_AUTH_LIMIT et RATE_LIMIT_AUTH_WINDOW_MS
   */
  get auth() {
    const config = getRateLimitConfig();
    return {
      ...config.auth,
      message:
        "Trop de tentatives de connexion, veuillez réessayer dans quelques minutes",
    };
  },

  /**
   * Rate limiting modéré pour les API publiques
   * Configurable via RATE_LIMIT_API_LIMIT et RATE_LIMIT_API_WINDOW_MS
   */
  get api() {
    const config = getRateLimitConfig();
    return {
      ...config.api,
      message: "Trop de requêtes, veuillez ralentir",
    };
  },

  /**
   * Rate limiting pour les endpoints admin
   * Configurable via RATE_LIMIT_ADMIN_LIMIT et RATE_LIMIT_ADMIN_WINDOW_MS
   */
  get admin() {
    const config = getRateLimitConfig();
    return {
      ...config.admin,
      message: "Trop de requêtes, veuillez ralentir",
    };
  },

  /**
   * Rate limiting très strict pour les endpoints sensibles (10 requêtes par heure)
   */
  strict: {
    limit: 10,
    windowMs: 60 * 60 * 1000, // 1 heure
    message: "Limite de requêtes atteinte, veuillez réessayer plus tard",
  },
};

/**
 * Ferme la connexion Redis proprement
 */
export const closeRateLimitStore = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
  store = null;
};
