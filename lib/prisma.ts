import { PrismaClient } from "@prisma/client";
import { getEnv } from "./env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Construit l'URL de connexion PostgreSQL avec les paramètres de pool optimisés
 */
const buildDatabaseUrl = (baseUrl: string): string => {
  try {
    const url = new URL(baseUrl);

    // Paramètres de pool de connexions optimisés
    // connection_limit: Nombre max de connexions dans le pool (défaut: nombre de CPU * 2 + 1)
    // pool_timeout: Temps d'attente pour obtenir une connexion (défaut: 10s)
    // connect_timeout: Temps d'attente pour établir une connexion (défaut: 5s)
    // statement_cache_size: Cache des requêtes préparées (0 = désactivé pour éviter les problèmes)

    // Ne pas modifier l'URL si elle contient déjà des paramètres
    if (
      url.searchParams.has("connection_limit") ||
      url.searchParams.has("pool_timeout")
    ) {
      return baseUrl;
    }

    // Ajouter les paramètres de pool
    url.searchParams.set("connection_limit", "10"); // Limite de connexions
    url.searchParams.set("pool_timeout", "10"); // 10 secondes
    url.searchParams.set("connect_timeout", "5"); // 5 secondes
    url.searchParams.set("statement_cache_size", "0"); // Désactiver le cache pour éviter les problèmes avec les requêtes dynamiques

    return url.toString();
  } catch {
    // Si l'URL n'est pas valide, retourner telle quelle
    return baseUrl;
  }
};

// Valider les variables d'environnement au démarrage
let env: ReturnType<typeof getEnv>;
try {
  env = getEnv();
} catch (error) {
  console.error(
    "❌ Erreur de configuration des variables d'environnement:",
    error
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
      console.warn(
        "⚠️ Variables d'environnement non validées, utilisation directe de process.env"
      );
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

// Fermer la connexion à l'arrêt de l'application
if (typeof window === "undefined" && process.env.NODE_ENV !== "production") {
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
