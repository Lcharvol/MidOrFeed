import { logger } from "./logger";

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

    // Envoyer l'alerte à un service externe si configuré (production ou si SLACK_WEBHOOK_URL est défini)
    // Permet aussi de tester en développement si le webhook est configuré
    this.sendToExternalService(alert);
  }

  /**
   * Retourne la couleur pour un niveau de sévérité (pour Slack)
   */
  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.LOW:
        return "#36a64f"; // Vert
      case AlertSeverity.MEDIUM:
        return "#ff9800"; // Orange
      case AlertSeverity.HIGH:
        return "#f44336"; // Rouge
      case AlertSeverity.CRITICAL:
        return "#d32f2f"; // Rouge foncé
      default:
        return "#9e9e9e"; // Gris
    }
  }

  /**
   * Envoie l'alerte à un service externe
   * Supporte Slack via webhook, et peut être étendu pour PagerDuty/Opsgenie
   */
  private sendToExternalService(alert: Alert): void {
    // Intégration Slack via webhook
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (slackWebhookUrl) {
      // Ne pas attendre la réponse pour ne pas bloquer l'exécution
      fetch(slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🚨 ${alert.severity.toUpperCase()}: ${alert.title}`,
          attachments: [
            {
              color: this.getSeverityColor(alert.severity),
              fields: [
                { title: "Service", value: alert.service, short: true },
                { title: "Message", value: alert.message, short: false },
                {
                  title: "Timestamp",
                  value: new Date(alert.timestamp).toISOString(),
                  short: true,
                },
                ...(alert.metadata
                  ? [
                      {
                        title: "Metadata",
                        value: JSON.stringify(alert.metadata, null, 2),
                        short: false,
                      },
                    ]
                  : []),
              ],
            },
          ],
        }),
      })
        .then((response) => {
          if (!response.ok) {
            logger.warn("Slack webhook returned error", {
              status: response.status,
              statusText: response.statusText,
              alertId: alert.id,
            });
          }
        })
        .catch((error) => {
          logger.error("Failed to send alert to Slack", error as Error, {
            alertId: alert.id,
          });
        });
    }

    // TODO: Intégration PagerDuty/Opsgenie pour les alertes critiques
    // if (alert.severity === AlertSeverity.CRITICAL || alert.severity === AlertSeverity.HIGH) {
    //   const pagerDutyKey = process.env.PAGERDUTY_API_KEY;
    //   if (pagerDutyKey) {
    //     // Envoyer à PagerDuty...
    //   }
    // }

    // Log l'alerte dans tous les cas
    // Pour les alertes critiques et hautes, utiliser error, sinon warn/info
    const logMessage = `ALERT [${alert.severity.toUpperCase()}]: ${
      alert.title
    }`;
    const logData = {
      service: alert.service,
      message: alert.message,
      ...(alert.metadata && { metadata: alert.metadata }),
    };

    switch (alert.severity) {
      case AlertSeverity.CRITICAL:
      case AlertSeverity.HIGH:
        logger.error(logMessage, undefined, logData);
        break;
      case AlertSeverity.MEDIUM:
        logger.warn(logMessage, logData);
        break;
      case AlertSeverity.LOW:
        logger.info(logMessage, logData);
        break;
    }
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
  critical: (
    title: string,
    message: string,
    service?: string,
    metadata?: Record<string, unknown>
  ) => {
    sendAlert(AlertSeverity.CRITICAL, title, message, service, metadata);
  },

  /**
   * Alerte haute - nécessite une attention rapide
   */
  high: (
    title: string,
    message: string,
    service?: string,
    metadata?: Record<string, unknown>
  ) => {
    sendAlert(AlertSeverity.HIGH, title, message, service, metadata);
  },

  /**
   * Alerte moyenne - nécessite une attention
   */
  medium: (
    title: string,
    message: string,
    service?: string,
    metadata?: Record<string, unknown>
  ) => {
    sendAlert(AlertSeverity.MEDIUM, title, message, service, metadata);
  },

  /**
   * Alerte basse - information
   */
  low: (
    title: string,
    message: string,
    service?: string,
    metadata?: Record<string, unknown>
  ) => {
    sendAlert(AlertSeverity.LOW, title, message, service, metadata);
  },
};

/**
 * Récupère les alertes récentes (pour l'endpoint /api/alerts)
 */
export const getRecentAlerts = (
  severity?: AlertSeverity,
  since?: number
): Alert[] => {
  return alertStore.getRecentAlerts(severity, since);
};
