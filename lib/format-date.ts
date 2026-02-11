import { formatDistanceToNow } from "date-fns";
import { fr, enUS } from "date-fns/locale";

const LOCALES = { fr, en: enUS } as const;

/**
 * Format a date as a relative string ("il y a 2 heures", "2 hours ago").
 * Falls back to a short absolute date for dates older than 30 days.
 */
export function formatRelativeDate(
  date: string | number | Date,
  locale: "fr" | "en" = "fr"
): string {
  const d = typeof date === "object" ? date : new Date(date);
  return formatDistanceToNow(d, {
    addSuffix: true,
    locale: LOCALES[locale],
  });
}
