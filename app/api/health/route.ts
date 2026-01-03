import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEnv } from "@/lib/env";
import { prismaWithTimeout } from "@/lib/timeout";
import { logger } from "@/lib/logger";
import { getRedis } from "@/lib/redis";

/**
 * GET /api/health
 * Health check endpoint pour vérifier l'état de l'application
 */
export async function GET() {
  const startTime = Date.now();
  const health: {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    uptime: number;
    services: {
      database: { status: "ok" | "error"; latency?: number; error?: string };
      redis: { status: "ok" | "error" | "not_configured"; latency?: number; error?: string };
      environment: { status: "ok" | "error"; error?: string };
    };
    version?: string;
  } = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: { status: "ok" },
      redis: { status: "not_configured" },
      environment: { status: "ok" },
    },
  };

  // Vérifier les variables d'environnement
  try {
    const env = getEnv();
    // Vérifier que les variables critiques sont présentes
    if (!env.DATABASE_URL || !env.RIOT_API_KEY) {
      health.services.environment = {
        status: "error",
        error: "Variables d'environnement manquantes",
      };
      health.status = "degraded";
    }
  } catch (error) {
    health.services.environment = {
      status: "error",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
    health.status = "unhealthy";
  }

  // Vérifier la connexion à la base de données
  try {
    const dbStartTime = Date.now();
    await prismaWithTimeout(() => prisma.$queryRaw`SELECT 1`, 5000);
    const dbLatency = Date.now() - dbStartTime;
    health.services.database = {
      status: "ok",
      latency: dbLatency,
    };

    // Si la latence est trop élevée, marquer comme dégradé
    if (dbLatency > 1000) {
      health.status = "degraded";
    }
  } catch (error) {
    health.services.database = {
      status: "error",
      error: error instanceof Error ? error.message : "Erreur de connexion",
    };
    health.status = "unhealthy";
    logger.error("Health check: Database connection failed", error as Error);
  }

  // Vérifier la connexion Redis (si configurée)
  try {
    const env = getEnv();
    if (env.REDIS_URL) {
      const redis = getRedis();
      const redisStartTime = Date.now();
      await redis.ping();
      const redisLatency = Date.now() - redisStartTime;
      health.services.redis = {
        status: "ok",
        latency: redisLatency,
      };

      // Si la latence Redis est trop élevée, marquer comme dégradé
      if (redisLatency > 500) {
        health.status = health.status === "unhealthy" ? "unhealthy" : "degraded";
      }
    }
  } catch (error) {
    health.services.redis = {
      status: "error",
      error: error instanceof Error ? error.message : "Erreur de connexion Redis",
    };
    // Redis failure degrades but doesn't make unhealthy (optional service)
    health.status = health.status === "unhealthy" ? "unhealthy" : "degraded";
    logger.warn("Health check: Redis connection failed", { error: error instanceof Error ? error.message : "Unknown error" });
  }

  const responseTime = Date.now() - startTime;

  // Déterminer le code de statut HTTP
  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

  return NextResponse.json(
    {
      ...health,
      responseTime,
    },
    {
      status: statusCode,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Response-Time": `${responseTime}ms`,
      },
    }
  );
}

