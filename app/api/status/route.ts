import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { getAllEndpointStats } from "@/lib/api-monitoring";
import { getMetrics, getTimingStats } from "@/lib/metrics";
import { getRecentAlerts } from "@/lib/alerting";
import { applySecurityHeaders } from "@/lib/security-headers";
import { prisma } from "@/lib/prisma";
import { prismaWithTimeout } from "@/lib/timeout";

/**
 * GET /api/status
 * Endpoint de status détaillé avec métriques, statistiques et alertes (admin seulement)
 */
export async function GET(request: NextRequest) {
  // Vérifier les permissions admin
  const authError = await requireAdmin(request);
  if (authError) {
    return authError;
  }

  try {
    // Récupérer les paramètres de la requête
    const url = new URL(request.url);
    const sinceParam = url.searchParams.get("since");
    const since = sinceParam ? parseInt(sinceParam, 10) : Date.now() - 3600000; // 1 heure par défaut

    // Récupérer les statistiques des endpoints
    const endpointStats = getAllEndpointStats();

    // Récupérer les métriques de timing pour les endpoints populaires
    const timingStats = [
      "api.champions.list",
      "api.items.list",
      "api.auth.login",
      "api.auth.signup",
      "db.query",
      "db.findMany",
      "db.findUnique",
    ].reduce((acc, name) => {
      const stats = getTimingStats(name, since);
      if (stats) {
        acc[name] = stats;
      }
      return acc;
    }, {} as Record<string, ReturnType<typeof getTimingStats>>);

    // Récupérer les alertes récentes
    const alerts = getRecentAlerts(undefined, since);

    // Vérifier la santé de la base de données
    let dbHealth: { status: "healthy" | "degraded" | "unhealthy"; latency: number } = {
      status: "unhealthy",
      latency: 0,
    };
    try {
      const dbStartTime = Date.now();
      await prismaWithTimeout(() => prisma.$queryRaw`SELECT 1`, 5000);
      const dbLatency = Date.now() - dbStartTime;
      dbHealth = {
        status: dbLatency > 1000 ? "degraded" : "healthy",
        latency: dbLatency,
      };
    } catch (error) {
      dbHealth = {
        status: "unhealthy",
        latency: 0,
      };
    }

    // Calculer les métriques globales
    const totalRequests = Object.values(endpointStats).reduce(
      (sum, stats) => sum + stats.count,
      0
    );
    const totalErrors = Object.values(endpointStats).reduce(
      (sum, stats) => sum + stats.errorCount,
      0
    );
    const globalErrorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

    const response = NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: dbHealth,
        },
        metrics: {
          endpoints: Object.keys(endpointStats).length,
          totalRequests,
          totalErrors,
          globalErrorRate: globalErrorRate * 100, // En pourcentage
        },
        endpointStats,
        timingStats,
        alerts: {
          count: alerts.length,
          recent: alerts.slice(-10), // 10 dernières alertes
        },
        period: {
          since: new Date(since).toISOString(),
          until: new Date().toISOString(),
        },
      },
      { status: 200 }
    );

    return applySecurityHeaders(response);
  } catch (error) {
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération du status",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
    return applySecurityHeaders(errorResponse);
  }
}

