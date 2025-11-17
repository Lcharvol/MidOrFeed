import { NextRequest, NextResponse } from "next/server";
import { recordMetric, recordTiming } from "./metrics";
import { alerting, AlertSeverity } from "./alerting";
import { logger } from "./logger";

/**
 * Statistiques de performance par endpoint
 */
interface EndpointStats {
  count: number;
  successCount: number;
  errorCount: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  errorRate: number;
  lastError?: {
    timestamp: number;
    message: string;
    statusCode: number;
  };
}

/**
 * Store pour les statistiques d'endpoints
 */
class EndpointStatsStore {
  private stats: Map<string, EndpointStats> = new Map();

  /**
   * Enregistre une requête réussie
   */
  recordSuccess(endpoint: string, duration: number): void {
    const current = this.stats.get(endpoint) || this.createEmptyStats();
    current.count++;
    current.successCount++;
    current.totalDuration += duration;
    current.avgDuration = current.totalDuration / current.count;
    current.minDuration = Math.min(current.minDuration, duration);
    current.maxDuration = Math.max(current.maxDuration, duration);
    current.errorRate = current.errorCount / current.count;

    this.stats.set(endpoint, current);
  }

  /**
   * Enregistre une erreur
   */
  recordError(
    endpoint: string,
    duration: number,
    statusCode: number,
    message: string
  ): void {
    const current = this.stats.get(endpoint) || this.createEmptyStats();
    current.count++;
    current.errorCount++;
    current.totalDuration += duration;
    current.avgDuration = current.totalDuration / current.count;
    current.minDuration = Math.min(current.minDuration, duration);
    current.maxDuration = Math.max(current.maxDuration, duration);
    current.errorRate = current.errorCount / current.count;
    current.lastError = {
      timestamp: Date.now(),
      message,
      statusCode,
    };

    this.stats.set(endpoint, current);

    // Alerter si le taux d'erreur est élevé
    if (current.errorRate > 0.1 && current.count >= 10) {
      // Plus de 10% d'erreurs avec au moins 10 requêtes
      alerting.high(
        `Taux d'erreur élevé sur ${endpoint}`,
        `Le taux d'erreur est de ${(current.errorRate * 100).toFixed(1)}% (${current.errorCount}/${current.count} erreurs)`,
        "api",
        {
          endpoint,
          errorRate: current.errorRate,
          errorCount: current.errorCount,
          totalCount: current.count,
        }
      );
    }

    // Alerter si le temps de réponse est trop élevé
    if (current.avgDuration > 5000 && current.count >= 10) {
      // Plus de 5 secondes en moyenne avec au moins 10 requêtes
      alerting.medium(
        `Temps de réponse élevé sur ${endpoint}`,
        `Le temps de réponse moyen est de ${current.avgDuration.toFixed(0)}ms`,
        "api",
        {
          endpoint,
          avgDuration: current.avgDuration,
          count: current.count,
        }
      );
    }
  }

  /**
   * Crée des statistiques vides
   */
  private createEmptyStats(): EndpointStats {
    return {
      count: 0,
      successCount: 0,
      errorCount: 0,
      totalDuration: 0,
      avgDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      errorRate: 0,
    };
  }

  /**
   * Récupère les statistiques pour un endpoint
   */
  getStats(endpoint: string): EndpointStats | null {
    return this.stats.get(endpoint) || null;
  }

  /**
   * Récupère toutes les statistiques
   */
  getAllStats(): Record<string, EndpointStats> {
    const result: Record<string, EndpointStats> = {};
    this.stats.forEach((stats, endpoint) => {
      result[endpoint] = stats;
    });
    return result;
  }

  /**
   * Réinitialise les statistiques
   */
  reset(): void {
    this.stats.clear();
  }
}

// Instance globale
const endpointStatsStore = new EndpointStatsStore();

/**
 * Wrapper pour les handlers API avec monitoring automatique
 */
export const withApiMonitoring = async (
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  endpointName?: string
): Promise<NextResponse> => {
  const startTime = Date.now();
  const method = request.method;
  const pathname = request.nextUrl.pathname;
  const endpoint = endpointName || `${method} ${pathname}`;

  try {
    const response = await handler();
    const duration = Date.now() - startTime;

    // Enregistrer les métriques
    recordTiming(`api.${endpoint}.duration`, duration, {
      method,
      status: response.status.toString(),
    });
    recordMetric(`api.${endpoint}.requests`, 1, { method, status: response.status.toString() });

    // Enregistrer les statistiques
    if (response.status >= 200 && response.status < 400) {
      endpointStatsStore.recordSuccess(endpoint, duration);
    } else {
      endpointStatsStore.recordError(
        endpoint,
        duration,
        response.status,
        `HTTP ${response.status}`
      );
    }

    // Ajouter des headers de monitoring
    response.headers.set("X-Response-Time", `${duration}ms`);
    response.headers.set("X-Endpoint", endpoint);

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Enregistrer l'erreur
    recordTiming(`api.${endpoint}.duration`, duration, {
      method,
      status: "500",
      error: "true",
    });
    recordMetric(`api.${endpoint}.errors`, 1, { method });

    // Enregistrer les statistiques
    endpointStatsStore.recordError(
      endpoint,
      duration,
      500,
      error instanceof Error ? error.message : "Unknown error"
    );

    // Logger l'erreur
    logger.error(`API Error on ${endpoint}`, error as Error, {
      method,
      pathname,
      duration,
    });

    // Alerter si c'est une erreur critique
    alerting.high(
      `Erreur API sur ${endpoint}`,
      error instanceof Error ? error.message : "Erreur inconnue",
      "api",
      {
        endpoint,
        method,
        pathname,
        duration,
      }
    );

    // Retourner une réponse d'erreur
    return NextResponse.json(
      {
        error: "Erreur interne du serveur",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
};

/**
 * Récupère les statistiques d'un endpoint
 */
export const getEndpointStats = (endpoint: string): EndpointStats | null => {
  return endpointStatsStore.getStats(endpoint);
};

/**
 * Récupère toutes les statistiques
 */
export const getAllEndpointStats = (): Record<string, EndpointStats> => {
  return endpointStatsStore.getAllStats();
};

