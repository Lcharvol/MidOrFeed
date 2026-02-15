/**
 * Formats a duration in seconds into a human-readable string.
 *
 * @param seconds - Duration in seconds, or null
 * @returns Formatted string like "45s", "2m 30s", or "1h 15m". Returns "—" for null/non-positive values.
 */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return "\u2014";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}
