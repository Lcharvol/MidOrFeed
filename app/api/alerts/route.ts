import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { getRecentAlerts, AlertSeverity } from "@/lib/alerting";
import { applySecurityHeaders } from "@/lib/security-headers";

/**
 * GET /api/alerts
 * Endpoint pour récupérer les alertes récentes (admin seulement)
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
    const severityParam = url.searchParams.get("severity");
    const sinceParam = url.searchParams.get("since");
    
    const severity = severityParam
      ? (severityParam.toUpperCase() as keyof typeof AlertSeverity)
      : undefined;
    const since = sinceParam ? parseInt(sinceParam, 10) : Date.now() - 3600000; // 1 heure par défaut

    // Récupérer les alertes
    const alerts = getRecentAlerts(
      severity ? AlertSeverity[severity] : undefined,
      since
    );

    // Grouper par sévérité
    const alertsBySeverity = alerts.reduce(
      (acc, alert) => {
        if (!acc[alert.severity]) {
          acc[alert.severity] = [];
        }
        acc[alert.severity].push(alert);
        return acc;
      },
      {} as Record<AlertSeverity, typeof alerts>
    );

    const response = NextResponse.json(
      {
        success: true,
        alerts: {
          total: alerts.length,
          bySeverity: {
            critical: alertsBySeverity[AlertSeverity.CRITICAL]?.length || 0,
            high: alertsBySeverity[AlertSeverity.HIGH]?.length || 0,
            medium: alertsBySeverity[AlertSeverity.MEDIUM]?.length || 0,
            low: alertsBySeverity[AlertSeverity.LOW]?.length || 0,
          },
          data: alerts,
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
        error: "Erreur lors de la récupération des alertes",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
    return applySecurityHeaders(errorResponse);
  }
}

