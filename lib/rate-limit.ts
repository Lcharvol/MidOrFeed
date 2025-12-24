import { NextRequest, NextResponse } from "next/server";

/**
 * Configuration du rate limiting
 * En production, utiliser Redis ou Upstash pour un rate limiting distribué
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
 * Store simple en mémoire pour le rate limiting
 * ⚠️ En production avec plusieurs instances, utiliser Redis/Upstash
 */
class MemoryStore {
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

  get(key: string): { count: number; resetTime: number } | undefined {
    return this.store.get(key);
  }

  set(key: string, value: { count: number; resetTime: number }): void {
    this.store.set(key, value);
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Store global (en production, utiliser Redis)
const store = new MemoryStore();

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
  const { limit, windowMs, message = "Trop de requêtes, veuillez réessayer plus tard", identifier } = config;

  // Identifier la requête (par défaut: IP depuis les headers)
  const id = identifier 
    ? await identifier(request)
    : request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

  const key = `${id}:${windowMs}`;
  const now = Date.now();
  
  // Récupérer ou initialiser le compteur
  const record = store.get(key);
  
  if (!record || record.resetTime < now) {
    // Nouveau window ou window expiré
    store.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
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
  store.set(key, record);

  return null; // OK
};

/**
 * Récupère les presets de rate limiting depuis les variables d'environnement
 * avec des valeurs par défaut raisonnables
 */
const getRateLimitConfig = () => {
  // Import dynamique pour éviter les problèmes de circular dependency
  const env = process.env;

  return {
    auth: {
      limit: parseInt(env.RATE_LIMIT_AUTH_LIMIT || "5", 10),
      windowMs: parseInt(env.RATE_LIMIT_AUTH_WINDOW_MS || String(15 * 60 * 1000), 10),
    },
    api: {
      limit: parseInt(env.RATE_LIMIT_API_LIMIT || "100", 10),
      windowMs: parseInt(env.RATE_LIMIT_API_WINDOW_MS || String(60 * 1000), 10),
    },
    admin: {
      limit: parseInt(env.RATE_LIMIT_ADMIN_LIMIT || "50", 10),
      windowMs: parseInt(env.RATE_LIMIT_ADMIN_WINDOW_MS || String(60 * 1000), 10),
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
      message: "Trop de tentatives de connexion, veuillez réessayer dans quelques minutes",
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

