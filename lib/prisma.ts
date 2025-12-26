import { PrismaClient, Prisma } from "@prisma/client";
import { getEnv } from "./env";
import { logger } from "./logger";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Construit l'URL de connexion PostgreSQL avec les paramètres de pool optimisés
 */
const buildDatabaseUrl = (baseUrl: string): string => {
  try {
    const url = new URL(baseUrl);

    // Paramètres de pool de connexions optimisés pour Fly.io
    // connection_limit: Limité pour éviter d'épuiser les connexions (1GB RAM = ~5-10 connexions)
    // pool_timeout: Temps d'attente pour obtenir une connexion
    // connect_timeout: Temps d'attente pour établir une connexion
    // idle_timeout: Fermer les connexions inutilisées après ce délai (important sur Fly.io)
    // keepalives: Activer les keepalives TCP pour détecter les connexions mortes

    // Ne pas modifier l'URL si elle contient déjà des paramètres de pool
    if (
      url.searchParams.has("connection_limit") ||
      url.searchParams.has("pool_timeout")
    ) {
      return baseUrl;
    }

    // Paramètres optimisés pour Fly.io avec 1GB de RAM
    url.searchParams.set("connection_limit", "5"); // Moins de connexions pour éviter OOM
    url.searchParams.set("pool_timeout", "20"); // 20 secondes pour obtenir une connexion
    url.searchParams.set("connect_timeout", "10"); // 10 secondes pour se connecter
    url.searchParams.set("statement_cache_size", "0"); // Désactiver le cache

    // Paramètres de keepalive pour détecter les connexions mortes
    // Ces paramètres aident à éviter "Server has closed the connection"
    url.searchParams.set("keepalives", "1");
    url.searchParams.set("keepalives_idle", "30"); // 30 secondes avant le premier keepalive
    url.searchParams.set("keepalives_interval", "10"); // 10 secondes entre les keepalives
    url.searchParams.set("keepalives_count", "3"); // 3 essais avant de considérer la connexion morte

    return url.toString();
  } catch {
    // Si l'URL n'est pas valide, retourner telle quelle
    return baseUrl;
  }
};

/**
 * Wrapper pour exécuter une opération Prisma avec retry automatique
 * Utile pour gérer les connexions fermées de manière transparente
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Vérifier si c'est une erreur de connexion récupérable
      const isConnectionError =
        error instanceof Prisma.PrismaClientKnownRequestError ||
        (error instanceof Error &&
          (error.message.includes("Server has closed the connection") ||
            error.message.includes("Connection reset") ||
            error.message.includes("Connection refused") ||
            error.message.includes("ECONNRESET") ||
            error.message.includes("ETIMEDOUT")));

      if (!isConnectionError || attempt === maxRetries) {
        throw error;
      }

      // Log et attendre avant de réessayer
      logger.warn(`Prisma connection error, retrying (${attempt}/${maxRetries})...`, {
        error: error instanceof Error ? error.message : "Unknown error",
        attempt,
      });

      // Attente exponentielle
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));

      // Tenter de reconnecter
      try {
        await prisma.$disconnect();
        await prisma.$connect();
      } catch {
        // Ignorer les erreurs de reconnexion, on réessaiera l'opération
      }
    }
  }

  throw lastError;
}

// Valider les variables d'environnement au démarrage
let env: ReturnType<typeof getEnv>;
try {
  env = getEnv();
} catch (error) {
  logger.error(
    "Erreur de configuration des variables d'environnement",
    error as Error
  );
  throw error;
}

// Configuration Prisma avec timeout et pool de connexions optimisé
export const prisma =
  globalForPrisma.prisma ??
  (() => {
    try {
      const databaseUrl = env.DATABASE_URL ?? process.env.DATABASE_URL ?? "";
      const optimizedUrl = databaseUrl
        ? buildDatabaseUrl(databaseUrl)
        : databaseUrl;

      return new PrismaClient({
        log:
          env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
        datasources: {
          db: {
            url: optimizedUrl,
          },
        },
      });
    } catch {
      // Si les variables d'environnement ne sont pas disponibles (par exemple pendant le build),
      // on crée un client Prisma avec les variables d'environnement directement
      logger.warn("Variables d'environnement non validées, utilisation directe de process.env", {
        context: "prisma-init",
      });
      const databaseUrl = process.env.DATABASE_URL ?? "";
      const optimizedUrl = databaseUrl
        ? buildDatabaseUrl(databaseUrl)
        : databaseUrl;

      return new PrismaClient({
        log:
          process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
        datasources: {
          db: {
            url: optimizedUrl,
          },
        },
      });
    }
  })();

// Mettre en cache le client Prisma pour éviter de créer de nouvelles connexions
if (typeof window === "undefined") {
  globalForPrisma.prisma = prisma;
}

// Gestion gracieuse de l'arrêt
if (typeof process !== "undefined") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });

  process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
