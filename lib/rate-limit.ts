import { NextRequest, NextResponse } from "next/server";

/**
 * Rate limiting en mémoire - simple et efficace pour une seule instance
 */

interface RateLimitConfig {
  limit: number;
  windowMs: number;
  message?: string;
  identifier?: (request: NextRequest) => string | Promise<string>;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// Store en mémoire
const store = new Map<string, RateLimitRecord>();

// Nettoyage périodique des entrées expirées
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
      if (value.resetTime < now) {
        store.delete(key);
      }
    }
  }, 60000);
}

/**
 * Rate limiting middleware pour Next.js API Routes
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

  const id = identifier
    ? await identifier(request)
    : request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

  const key = `${id}:${windowMs}`;
  const now = Date.now();

  const record = store.get(key);

  if (!record || record.resetTime < now) {
    store.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return null;
  }

  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return NextResponse.json(
      { error: message, retryAfter },
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

  record.count++;
  return null;
};

/**
 * Presets de rate limiting
 */
export const rateLimitPresets = {
  auth: {
    limit: parseInt(process.env.RATE_LIMIT_AUTH_LIMIT || "5", 10),
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || String(15 * 60 * 1000), 10),
    message: "Trop de tentatives de connexion, veuillez réessayer dans quelques minutes",
  },
  api: {
    limit: parseInt(process.env.RATE_LIMIT_API_LIMIT || "100", 10),
    windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW_MS || String(60 * 1000), 10),
    message: "Trop de requêtes, veuillez ralentir",
  },
  admin: {
    limit: parseInt(process.env.RATE_LIMIT_ADMIN_LIMIT || "50", 10),
    windowMs: parseInt(process.env.RATE_LIMIT_ADMIN_WINDOW_MS || String(60 * 1000), 10),
    message: "Trop de requêtes, veuillez ralentir",
  },
  strict: {
    limit: 10,
    windowMs: 60 * 60 * 1000,
    message: "Limite de requêtes atteinte, veuillez réessayer plus tard",
  },
};
