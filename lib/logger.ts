import { isProduction, isDevelopment } from "./env";

/**
 * Niveaux de log
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

/**
 * Format de log structuré
 */
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Logger structuré pour l'application
 * En production, ces logs peuvent être envoyés à un service de log centralisé (ex: Datadog, LogRocket)
 */
class Logger {
  private service: string;

  constructor(service = "app") {
    this.service = service;
  }

  /**
   * Format et affiche un log
   */
  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: Error
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      ...(data && { data }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          ...(isDevelopment() && { stack: error.stack }),
        },
      }),
    };

    // En production, on log en JSON pour faciliter le parsing
    if (isProduction()) {
      console.log(JSON.stringify(entry));
    } else {
      // En développement, on log de manière plus lisible
      const prefix = `[${level.toUpperCase()}] [${entry.service}]`;
      const suffix = data ? `\n${JSON.stringify(data, null, 2)}` : "";
      const errorSuffix = error ? `\n${error.stack}` : "";

      switch (level) {
        case LogLevel.DEBUG:
          console.debug(`${prefix} ${message}${suffix}`);
          break;
        case LogLevel.INFO:
          console.info(`${prefix} ${message}${suffix}`);
          break;
        case LogLevel.WARN:
          console.warn(`${prefix} ${message}${suffix}`);
          break;
        case LogLevel.ERROR:
          console.error(`${prefix} ${message}${suffix}${errorSuffix}`);
          break;
      }
    }
  }

  /**
   * Log de debug (seulement en développement)
   */
  debug(message: string, data?: Record<string, unknown>): void {
    if (isDevelopment()) {
      this.log(LogLevel.DEBUG, message, data);
    }
  }

  /**
   * Log d'information
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log d'avertissement
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log d'erreur
   */
  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, data, error);
  }
}

/**
 * Crée un logger pour un service spécifique
 */
export const createLogger = (service: string): Logger => {
  return new Logger(service);
};

/**
 * Logger par défaut
 */
export const logger = new Logger();
