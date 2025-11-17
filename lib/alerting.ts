import { logger } from "./logger";
import { isProduction } from "./env";

/**
 * Niveaux de sévérité pour les alertes
 */
export enum AlertSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Interface pour une alerte
 */
export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  service: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Store simple pour les alertes récentes
 * En production, envoyer à un service d'alerting (ex: PagerDuty, Opsgenie, Slack)
 */
class AlertStore {
  private alerts: Alert[] = [];
  private maxSize = 100; // Limiter la taille pour éviter la surconsommation mémoire

  /**
   * Enregistre une alerte
   */
  record(alert: Alert): void {
    this.alerts.push(alert);

    // Limiter la taille
    if (this.alerts.length > this.maxSize) {
      this.alerts.shift();
    }

    // En production, envoyer l'alerte à un service externe
    if (isProduction()) {
      this.sendToExternalService(alert);
    }
  }

  /**
   * Envoie l'alerte à un service externe
   * TODO: Intégrer avec PagerDuty, Opsgenie, Slack, etc.
   */
  private sendToExternalService(alert: Alert): void {
    // Exemple d'intégration avec un webhook Slack
    // const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    // if (webhookUrl) {
    //   fetch(webhookUrl, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       text: `🚨 ${alert.severity.toUpperCase()}: ${alert.title}`,
    //       attachments: [{
    //         color: this.getSeverityColor(alert.severity),
    //         fields: [
    //           { title: "Service", value: alert.service, short: true },
    //           { title: "Message", value: alert.message, short: false },
    //         ],
    //       }],
    //     }),
    //   }).catch((error) => {
    //     logger.error("Failed to send alert to external service", error);
    //   });
    // }

    // Pour l'instant, on log juste l'alerte
    logger.error(`ALERT [${alert.severity.toUpperCase()}]: ${alert.title}`, new Error(alert.message), {
      service: alert.service,
      metadata: alert.metadata,
    });
  }

  /**
   * Récupère les alertes récentes
   */
  getRecentAlerts(severity?: AlertSeverity, since?: number): Alert[] {
    let filtered = this.alerts;

    if (severity) {
      filtered = filtered.filter((a) => a.severity === severity);
    }

    if (since) {
      filtered = filtered.filter((a) => a.timestamp >= since);
    }

    return filtered;
  }

  /**
   * Vide les alertes
   */
  clear(): void {
    this.alerts = [];
  }
}

// Instance globale
const alertStore = new AlertStore();

/**
 * Génère un ID unique pour une alerte
 */
const generateAlertId = (): string => {
  return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Envoie une alerte
 */
export const sendAlert = (
  severity: AlertSeverity,
  title: string,
  message: string,
  service: string = "app",
  metadata?: Record<string, unknown>
): void => {
  const alert: Alert = {
    id: generateAlertId(),
    severity,
    title,
    message,
    service,
    timestamp: Date.now(),
    metadata,
  };

  alertStore.record(alert);
};

/**
 * Helpers pour envoyer des alertes par niveau de sévérité
 */
export const alerting = {
  /**
   * Alerte critique - nécessite une action immédiate
   */
  critical: (title: string, message: string, service?: string, metadata?: Record<string, unknown>) => {
    sendAlert(AlertSeverity.CRITICAL, title, message, service, metadata);
  },

  /**
   * Alerte haute - nécessite une attention rapide
   */
  high: (title: string, message: string, service?: string, metadata?: Record<string, unknown>) => {
    sendAlert(AlertSeverity.HIGH, title, message, service, metadata);
  },

  /**
   * Alerte moyenne - nécessite une attention
   */
  medium: (title: string, message: string, service?: string, metadata?: Record<string, unknown>) => {
    sendAlert(AlertSeverity.MEDIUM, title, message, service, metadata);
  },

  /**
   * Alerte basse - information
   */
  low: (title: string, message: string, service?: string, metadata?: Record<string, unknown>) => {
    sendAlert(AlertSeverity.LOW, title, message, service, metadata);
  },
};

/**
 * Récupère les alertes récentes (pour l'endpoint /api/alerts)
 */
export const getRecentAlerts = (severity?: AlertSeverity, since?: number): Alert[] => {
  return alertStore.getRecentAlerts(severity, since);
};

