import { broadcastToAdmins } from "../server/notification-hub";
import { WORKER_DESCRIPTIONS } from "./index";
import type { NotificationPayload, NotificationVariant } from "@/types";

/**
 * Format a job result into a human-readable message
 */
function formatResultMessage(result: Record<string, unknown>): string {
  const parts: string[] = [];

  // Duration
  if (typeof result.duration === "number") {
    const durationSec = (result.duration / 1000).toFixed(1);
    parts.push(`${durationSec}s`);
  }

  // Count fields (generic handling for different job types)
  const countFields = [
    { key: "championsProcessed", label: "champions" },
    { key: "suggestionsGenerated", label: "suggestions" },
    { key: "playersCrawled", label: "joueurs" },
    { key: "matchesCollected", label: "matchs" },
    { key: "entriesSynced", label: "entrées" },
    { key: "championsUpdated", label: "champions" },
    { key: "itemsUpdated", label: "items" },
    { key: "championsAnalyzed", label: "champions" },
    { key: "synergiesComputed", label: "synergies" },
    { key: "buildsGenerated", label: "builds" },
    { key: "matchesDeleted", label: "matchs supprimés" },
    { key: "accountsRefreshed", label: "comptes" },
    { key: "usersReset", label: "utilisateurs" },
  ];

  for (const field of countFields) {
    const value = result[field.key];
    if (typeof value === "number" && value > 0) {
      parts.push(`${value} ${field.label}`);
      break; // Only show the first matching count
    }
  }

  // Errors count
  if (Array.isArray(result.errors) && result.errors.length > 0) {
    parts.push(`${result.errors.length} erreur(s)`);
  }

  return parts.join(" - ") || "Terminé";
}

/**
 * Send a notification to admins when a job completes successfully
 */
export function notifyJobCompleted(
  queueName: string,
  jobId: string | undefined,
  result: Record<string, unknown>
): void {
  const desc = WORKER_DESCRIPTIONS[queueName];
  if (!desc) {
    console.warn(`[JobNotifications] Unknown queue: ${queueName}`);
    return;
  }

  const hasErrors = Array.isArray(result.errors) && result.errors.length > 0;
  const variant: NotificationVariant = hasErrors ? "warning" : "success";
  const title = hasErrors
    ? `${desc.name} terminé avec erreurs`
    : `${desc.name} terminé`;

  const payload: NotificationPayload = {
    id: crypto.randomUUID(),
    title,
    message: formatResultMessage(result),
    variant,
    createdAt: new Date().toISOString(),
    metadata: {
      type: "job",
      jobId,
      queue: queueName,
      status: "completed",
      ...result,
    },
  };

  broadcastToAdmins(payload);
}

/**
 * Send a notification to admins when a job fails
 */
export function notifyJobFailed(
  queueName: string,
  jobId: string | undefined,
  error: Error
): void {
  const desc = WORKER_DESCRIPTIONS[queueName];
  if (!desc) {
    console.warn(`[JobNotifications] Unknown queue: ${queueName}`);
    return;
  }

  const payload: NotificationPayload = {
    id: crypto.randomUUID(),
    title: `${desc.name} échoué`,
    message: error.message || "Erreur inconnue",
    variant: "error",
    createdAt: new Date().toISOString(),
    metadata: {
      type: "job",
      jobId,
      queue: queueName,
      status: "failed",
      error: error.message,
    },
  };

  broadcastToAdmins(payload);
}
