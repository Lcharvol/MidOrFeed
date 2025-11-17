import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { getMetrics, getTimingStats } from "@/lib/metrics";
import { applySecurityHeaders } from "@/lib/security-headers";

/**
 * GET /api/metrics
 * Endpoint pour récupérer les métriques de l'application (admin seulement)
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
    const metricName = url.searchParams.get("name");
    const sinceParam = url.searchParams.get("since");
    const since = sinceParam ? parseInt(sinceParam, 10) : Date.now() - 3600000; // 1 heure par défaut

    // Récupérer les métriques
    const metrics = getMetrics(metricName || undefined, since);

    // Récupérer les statistiques de timing pour les endpoints populaires
    const endpointStats = [
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

    const response = NextResponse.json(
      {
        success: true,
        metrics: {
          count: metrics.length,
          data: metrics.slice(-100), // Dernières 100 métriques
        },
        timings: endpointStats,
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
        error: "Erreur lors de la récupération des métriques",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
    return applySecurityHeaders(errorResponse);
  }
}

