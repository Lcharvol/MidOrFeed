import { fetchWithTimeout } from "./timeout";
import { getEnv } from "./env";
import { CacheTTL, invalidateCachePrefix, cache } from "./cache";
import { logger } from "./logger";
import { alerting } from "./alerting";

/**
 * Client API Riot Games avec gestion des rate limits, cache et retry
 */

/**
 * Codes d'erreur HTTP spécifiques à l'API Riot
 */
export enum RiotApiErrorCode {
  RATE_LIMIT = 429,
  NOT_FOUND = 404,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  SERVER_ERROR = 500,
  TIMEOUT = 408,
}

/**
 * Options pour les requêtes Riot API
 */
export interface RiotApiOptions {
  /**
   * Région pour la requête (détermine l'endpoint)
   */
  region?: string;
  /**
   * Timeout en millisecondes (défaut: depuis getEnv())
   */
  timeout?: number;
  /**
   * Utiliser le cache (défaut: true)
   */
  useCache?: boolean;
  /**
   * TTL du cache en millisecondes (défaut: 5 minutes)
   */
  cacheTTL?: number;
  /**
   * Clé de cache personnalisée (sinon générée à partir de l'URL)
   */
  cacheKey?: string;
  /**
   * Nombre maximum de tentatives (défaut: 3)
   */
  maxRetries?: number;
  /**
   * Délai initial pour le backoff exponentiel en ms (défaut: 1000)
   */
  initialBackoffMs?: number;
  /**
   * Multiplicateur pour le backoff exponentiel (défaut: 2)
   */
  backoffMultiplier?: number;
  /**
   * Délai maximum pour le backoff en ms (défaut: 60000 = 1 minute)
   */
  maxBackoffMs?: number;
  /**
   * Headers HTTP supplémentaires à inclure dans la requête
   */
  headers?: Record<string, string>;
}

/**
 * Résultat d'une requête Riot API
 */
export interface RiotApiResponse<T = unknown> {
  data: T;
  cached: boolean;
  attempt: number;
  retryAfter?: number;
}

/**
 * État du rate limiter par routing (europe/americas/asia)
 */
interface RateLimiterState {
  requests: number;
  windowStart: number;
  windowDuration: number;
  limit: number;
}

/**
 * Rate limiters globaux par routing
 */
const rateLimiters: Map<string, RateLimiterState> = new Map();

/**
 * Obtient ou crée un rate limiter pour un routing donné
 */
const getRateLimiter = (routing: string): RateLimiterState => {
  const key = routing.toLowerCase();

  if (!rateLimiters.has(key)) {
    rateLimiters.set(key, {
      requests: 0,
      windowStart: Date.now(),
      windowDuration: 120000, // 2 minutes
      limit: 100, // 100 requêtes par 2 minutes par défaut
    });
  }

  return rateLimiters.get(key)!;
};

/**
 * Vérifie et met à jour le rate limiter
 */
const checkRateLimit = (
  routing: string
): { allowed: boolean; waitMs?: number } => {
  const limiter = getRateLimiter(routing);
  const now = Date.now();

  // Réinitialiser la fenêtre si elle est expirée
  if (now - limiter.windowStart >= limiter.windowDuration) {
    limiter.requests = 0;
    limiter.windowStart = now;
  }

  // Vérifier si on a atteint la limite
  if (limiter.requests >= limiter.limit) {
    const waitMs = limiter.windowDuration - (now - limiter.windowStart);
    return { allowed: false, waitMs };
  }

  limiter.requests++;
  return { allowed: true };
};

/**
 * Calcule le délai de backoff exponentiel
 */
const calculateBackoff = (
  attempt: number,
  initialBackoffMs: number,
  multiplier: number,
  maxBackoffMs: number,
  retryAfter?: number
): number => {
  // Si retryAfter est fourni (header Retry-After), l'utiliser
  if (retryAfter !== undefined) {
    return Math.min(retryAfter * 1000, maxBackoffMs);
  }

  // Sinon, utiliser le backoff exponentiel
  const backoff = initialBackoffMs * Math.pow(multiplier, attempt - 1);
  return Math.min(backoff, maxBackoffMs);
};

/**
 * Fait une requête à l'API Riot avec retry, backoff exponentiel, cache et rate limiting
 */
export const riotApiRequest = async <T = unknown>(
  url: string,
  options: RiotApiOptions = {}
): Promise<RiotApiResponse<T>> => {
  const env = getEnv();
  const {
    region,
    timeout = env.API_TIMEOUT_MS,
    useCache = true,
    cacheTTL = CacheTTL.MEDIUM, // 5 minutes par défaut
    cacheKey,
    maxRetries = 3,
    initialBackoffMs = 1000,
    backoffMultiplier = 2,
    maxBackoffMs = 60000,
  } = options;

  // Construire la clé de cache
  const effectiveCacheKey = cacheKey || `riot:${url}`;

  // Vérifier le cache si activé
  if (useCache) {
    const cached = cache.get<T>(effectiveCacheKey);

    if (cached !== null) {
      return {
        data: cached,
        cached: true,
        attempt: 0,
      };
    }
  }

  // Extraire le routing de l'URL si la région est fournie
  const routing = extractRoutingFromUrl(url, region);

  // Gérer les retries avec backoff exponentiel
  let lastError: Error | null = null;
  let retryAfter: number | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Vérifier le rate limit avant de faire la requête
      if (routing) {
        const rateLimitCheck = checkRateLimit(routing);
        if (!rateLimitCheck.allowed) {
          const waitMs = rateLimitCheck.waitMs || initialBackoffMs;
          logger.warn(
            `Rate limit atteint pour ${routing}, attente de ${waitMs}ms`,
            {
              routing,
              waitMs,
            }
          );
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue; // Réessayer après l'attente
        }
      }

      // Faire la requête avec timeout
      const riotApiKey = env.RIOT_API_KEY;
      if (!riotApiKey) {
        throw new Error("RIOT_API_KEY n'est pas configurée");
      }

      const response = await fetchWithTimeout(
        url,
        {
          ...options,
          headers: {
            ...(options.headers || {}),
            "X-Riot-Token": riotApiKey,
          },
        },
        timeout
      );

      // Gérer les codes de statut spécifiques
      if (response.status === RiotApiErrorCode.RATE_LIMIT) {
        // Rate limit : utiliser le header Retry-After
        const retryAfterHeader = response.headers.get("Retry-After");
        retryAfter = retryAfterHeader
          ? parseInt(retryAfterHeader, 10)
          : undefined;

        // Calculer le délai avec backoff exponentiel
        const backoffMs = calculateBackoff(
          attempt,
          initialBackoffMs,
          backoffMultiplier,
          maxBackoffMs,
          retryAfter
        );

        if (attempt < maxRetries) {
          logger.warn(
            `Rate limit 429, retry dans ${backoffMs}ms (tentative ${attempt}/${maxRetries})`,
            {
              url,
              attempt,
              retryAfter,
              backoffMs,
            }
          );

          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue; // Réessayer
        } else {
          alerting.high(
            "Rate limit Riot API atteint",
            `Maximum de tentatives atteint pour ${url}`,
            "riot-api",
            { url, region, attempt }
          );
          throw new Error(`Rate limit atteint après ${maxRetries} tentatives`);
        }
      }

      if (!response.ok) {
        // Erreurs non récupérables
        if (
          response.status === RiotApiErrorCode.NOT_FOUND ||
          response.status === RiotApiErrorCode.UNAUTHORIZED ||
          response.status === RiotApiErrorCode.FORBIDDEN
        ) {
          throw new Error(
            `Erreur API Riot ${response.status}: ${response.statusText}`
          );
        }

        // Erreurs serveur : retry avec backoff
        if (response.status >= 500 && attempt < maxRetries) {
          const backoffMs = calculateBackoff(
            attempt,
            initialBackoffMs,
            backoffMultiplier,
            maxBackoffMs
          );

          logger.warn(
            `Erreur serveur ${response.status}, retry dans ${backoffMs}ms (tentative ${attempt}/${maxRetries})`,
            { url, status: response.status, attempt, backoffMs }
          );

          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue; // Réessayer
        }

        throw new Error(
          `Erreur API Riot ${response.status}: ${response.statusText}`
        );
      }

      // Parser la réponse
      const data = (await response.json()) as T;

      // Mettre en cache si activé
      if (useCache) {
        cache.set(effectiveCacheKey, data, cacheTTL);
      }

      return {
        data,
        cached: false,
        attempt,
        retryAfter,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Si c'est une erreur de timeout et qu'on peut réessayer
      if (
        error instanceof Error &&
        error.message.includes("expiré") &&
        attempt < maxRetries
      ) {
        const backoffMs = calculateBackoff(
          attempt,
          initialBackoffMs,
          backoffMultiplier,
          maxBackoffMs
        );

        logger.warn(
          `Timeout, retry dans ${backoffMs}ms (tentative ${attempt}/${maxRetries})`,
          { url, attempt, backoffMs }
        );

        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue; // Réessayer
      }

      // Si c'est la dernière tentative, lancer l'erreur
      if (attempt === maxRetries) {
        logger.error(
          `Erreur API Riot après ${maxRetries} tentatives`,
          lastError,
          {
            url,
            region,
            attempt,
          }
        );
        alerting.medium("Erreur API Riot", lastError.message, "riot-api", {
          url,
          region,
          attempt,
        });
        throw lastError;
      }
    }
  }

  // Ne devrait jamais arriver ici, mais au cas où
  throw lastError || new Error("Erreur inconnue lors de la requête API Riot");
};

/**
 * Extrait le routing depuis l'URL ou la région
 */
const extractRoutingFromUrl = (url: string, region?: string): string | null => {
  // Si la région est fournie, mapper vers le routing
  if (region) {
    // Utiliser import dynamique pour éviter les dépendances circulaires
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { REGION_TO_ROUTING } = require("@/constants/regions");
    return REGION_TO_ROUTING[region.toLowerCase()] || null;
  }

  // Sinon, extraire depuis l'URL
  const match = url.match(/https:\/\/([^.]+)\.api\.riotgames\.com/);
  return match ? match[1] : null;
};

/**
 * Invalide le cache pour une URL ou un pattern
 */
export const invalidateRiotCache = (pattern: string): void => {
  invalidateCachePrefix(`riot:${pattern}`);
};
