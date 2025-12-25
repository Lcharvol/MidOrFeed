import { z } from "zod";

/**
 * Validation des variables d'environnement
 * Utilise Zod pour valider et typer toutes les variables d'environnement
 */
const envSchema = z.object({
  // Base de données (optionnel pour le build)
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL doit être une URL valide")
    .optional(),

  // Riot API (optionnel pour le build)
  RIOT_API_KEY: z.string().min(1, "RIOT_API_KEY est requis").optional(),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),

  // Environnement
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // URLs (optionnelles)
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Timeouts (optionnels, avec valeurs par défaut)
  DB_TIMEOUT_MS: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 30000)),
  API_TIMEOUT_MS: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10000)),

  // JWT Secret (optionnel, génère une clé par défaut pour le développement)
  JWT_SECRET: z.string().optional(),

  // Redis URL (optionnel, pour cache et rate limiting distribués)
  REDIS_URL: z.string().url().optional(),

  // Slack Webhook URL (optionnel, pour les alertes)
  SLACK_WEBHOOK_URL: z.string().url().optional(),

  // Anthropic API (pour l'analyse AI des matchs)
  ANTHROPIC_API_KEY: z.string().optional(),

  // Rate limiting (configurable par environnement)
  RATE_LIMIT_AUTH_LIMIT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 5)),
  RATE_LIMIT_AUTH_WINDOW_MS: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 15 * 60 * 1000)),
  RATE_LIMIT_API_LIMIT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 100)),
  RATE_LIMIT_API_WINDOW_MS: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 60 * 1000)),
  RATE_LIMIT_ADMIN_LIMIT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50)),
  RATE_LIMIT_ADMIN_WINDOW_MS: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 60 * 1000)),

  // Cache TTL (en secondes)
  CACHE_TTL_SHORT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 60)),
  CACHE_TTL_MEDIUM: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 300)),
  CACHE_TTL_LONG: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 3600)),

  // Region par defaut pour Riot API
  DEFAULT_RIOT_REGION: z.string().optional().default("euw1"),

  // Taille maximale des requêtes (en bytes)
  MAX_REQUEST_SIZE: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1024 * 1024)),
});

type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

/**
 * Récupère et valide les variables d'environnement
 * En mode build, certaines variables peuvent être manquantes
 * @throws {Error} Si une variable requise est invalide (mais pas si elle est manquante pendant le build)
 */
export const getEnv = (): Env => {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Pendant le build (NODE_ENV === "production" ou build time), certaines variables peuvent être manquantes
      const isBuildTime =
        typeof window === "undefined" &&
        process.env.NEXT_PHASE === "phase-production-build";

      if (isBuildTime) {
        // Pendant le build, on retourne des valeurs par défaut
        validatedEnv = {
          DATABASE_URL: process.env.DATABASE_URL ?? "",
          RIOT_API_KEY: process.env.RIOT_API_KEY ?? "",
          GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
          NEXT_PUBLIC_GOOGLE_CLIENT_ID:
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          NODE_ENV:
            (process.env.NODE_ENV as "development" | "production" | "test") ??
            "production",
          NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
          DB_TIMEOUT_MS: 30000,
          API_TIMEOUT_MS: 10000,
        } as Env;
        return validatedEnv;
      }

      // En runtime, on valide strictement
      const missingVars = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");
      throw new Error(
        `Variables d'environnement invalides ou manquantes:\n${missingVars}`
      );
    }
    throw error;
  }
};

/**
 * Vérifie si on est en production
 */
export const isProduction = (): boolean => {
  return getEnv().NODE_ENV === "production";
};

/**
 * Vérifie si on est en développement
 */
export const isDevelopment = (): boolean => {
  return getEnv().NODE_ENV === "development";
};
