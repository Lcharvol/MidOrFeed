import { isProduction } from "./env";

/**
 * Métriques de performance et monitoring
 */

interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: number;
}

interface TimingMetric {
  name: string;
  duration: number;
  tags?: Record<string, string>;
  timestamp: number;
}

/**
 * Store simple en mémoire pour les métriques
 * En production, envoyer à un service de métriques (ex: Datadog, Prometheus)
 */
class MetricsStore {
  private metrics: Metric[] = [];
  private timings: TimingMetric[] = [];
  private maxSize = 1000; // Limiter la taille pour éviter la surconsommation mémoire

  /**
   * Enregistre une métrique
   */
  record(name: string, value: number, tags?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      tags,
      timestamp: Date.now(),
    });

    // Limiter la taille
    if (this.metrics.length > this.maxSize) {
      this.metrics.shift();
    }
  }

  /**
   * Enregistre une métrique de timing
   */
  recordTiming(name: string, duration: number, tags?: Record<string, string>): void {
    this.timings.push({
      name,
      duration,
      tags,
      timestamp: Date.now(),
    });

    // Limiter la taille
    if (this.timings.length > this.maxSize) {
      this.timings.shift();
    }
  }

  /**
   * Récupère les métriques récentes
   */
  getMetrics(name?: string, since?: number): Metric[] {
    let filtered = this.metrics;
    
    if (name) {
      filtered = filtered.filter((m) => m.name === name);
    }
    
    if (since) {
      filtered = filtered.filter((m) => m.timestamp >= since);
    }
    
    return filtered;
  }

  /**
   * Récupère les timings récents
   */
  getTimings(name?: string, since?: number): TimingMetric[] {
    let filtered = this.timings;
    
    if (name) {
      filtered = filtered.filter((t) => t.name === name);
    }
    
    if (since) {
      filtered = filtered.filter((t) => t.timestamp >= since);
    }
    
    return filtered;
  }

  /**
   * Calcule les statistiques pour un nom de métrique
   */
  getStats(name: string, since?: number): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
  } | null {
    const metrics = this.getMetrics(name, since);
    
    if (metrics.length === 0) {
      return null;
    }
    
    const values = metrics.map((m) => m.value);
    
    return {
      count: values.length,
      sum: values.reduce((a, b) => a + b, 0),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  /**
   * Calcule les statistiques de timing
   */
  getTimingStats(name: string, since?: number): {
    count: number;
    totalDuration: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const timings = this.getTimings(name, since);
    
    if (timings.length === 0) {
      return null;
    }
    
    const durations = timings.map((t) => t.duration).sort((a, b) => a - b);
    const count = durations.length;
    const totalDuration = durations.reduce((a, b) => a + b, 0);
    const avgDuration = totalDuration / count;
    
    // Calculer les percentiles
    const p50 = durations[Math.floor(count * 0.5)] || 0;
    const p95 = durations[Math.floor(count * 0.95)] || 0;
    const p99 = durations[Math.floor(count * 0.99)] || 0;
    
    return {
      count,
      totalDuration,
      avgDuration,
      minDuration: durations[0] || 0,
      maxDuration: durations[count - 1] || 0,
      p50,
      p95,
      p99,
    };
  }

  /**
   * Vide les métriques
   */
  clear(): void {
    this.metrics = [];
    this.timings = [];
  }
}

// Instance globale
const metricsStore = new MetricsStore();

/**
 * Enregistre une métrique
 */
export const recordMetric = (
  name: string,
  value: number,
  tags?: Record<string, string>
): void => {
  if (isProduction()) {
    // En production, envoyer à un service de métriques
    // Exemple: datadogClient.increment(name, value, tags);
  }
  
  metricsStore.record(name, value, tags);
};

/**
 * Enregistre un timing
 */
export const recordTiming = (
  name: string,
  duration: number,
  tags?: Record<string, string>
): void => {
  if (isProduction()) {
    // En production, envoyer à un service de métriques
    // Exemple: datadogClient.timing(name, duration, tags);
  }
  
  metricsStore.recordTiming(name, duration, tags);
};

/**
 * Wrapper pour mesurer le temps d'exécution d'une fonction
 */
export const measureTiming = async <T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> => {
  const startTime = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    recordTiming(`${name}.success`, duration, tags);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    recordTiming(`${name}.error`, duration, {
      ...tags,
      error: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
};

/**
 * Récupère les métriques (pour l'endpoint /api/metrics)
 */
export const getMetrics = (name?: string, since?: number): Metric[] => {
  return metricsStore.getMetrics(name, since);
};

/**
 * Récupère les statistiques de timing
 */
export const getTimingStats = (
  name: string,
  since?: number
): ReturnType<MetricsStore["getTimingStats"]> => {
  return metricsStore.getTimingStats(name, since);
};

