import { cn } from "@/lib/utils";
import type { CompositionRole } from "@/lib/compositions/roles";

export const formatConfidence = (confidence: number): string =>
  `${Math.round(Math.min(Math.max(confidence * 100, 0), 100))}%`;

export const formatUpdatedAt = (value: string): string => {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export const compositionBackground = (role: CompositionRole): string =>
  cn(
    "rounded-2xl border-2 p-6 transition-shadow hover:shadow-lg bg-gradient-to-br",
    role === "TOP" && "from-blue-500/10 via-background to-background",
    role === "JUNGLE" && "from-emerald-500/10 via-background to-background",
    role === "MIDDLE" && "from-purple-500/10 via-background to-background",
    role === "BOTTOM" && "from-orange-500/10 via-background to-background",
    role === "UTILITY" && "from-pink-500/10 via-background to-background"
  );

export const championBadgeClass = (role: CompositionRole): string =>
  cn(
    "rounded-full px-3 py-1 text-xs font-semibold uppercase",
    role === "TOP" && "bg-blue-500/20 text-blue-500",
    role === "JUNGLE" && "bg-emerald-500/20 text-emerald-500",
    role === "MIDDLE" && "bg-purple-500/20 text-purple-500",
    role === "BOTTOM" && "bg-orange-500/20 text-orange-500",
    role === "UTILITY" && "bg-pink-500/20 text-pink-500"
  );

