/**
 * Constantes de couleurs pour les éléments de jeu
 * Utilise les classes du design system autant que possible
 */

// ============================================================================
// ÉQUIPES (Bleu / Rouge)
// ============================================================================

export const TEAM_STYLES = {
  blue: {
    bg: "bg-info-muted",
    bgSubtle: "bg-info-muted/50",
    border: "border-info/30",
    text: "text-info-muted-foreground",
    accent: "bg-info",
    accentText: "text-info-foreground",
  },
  red: {
    bg: "bg-danger-muted",
    bgSubtle: "bg-danger-muted/50",
    border: "border-danger/30",
    text: "text-danger-muted-foreground",
    accent: "bg-danger",
    accentText: "text-danger-foreground",
  },
} as const;

export type TeamColor = keyof typeof TEAM_STYLES;

// ============================================================================
// KDA (Kill/Death/Assist ratio)
// ============================================================================

export const KDA_STYLES = {
  /** KDA >= 5 - Excellent */
  excellent: {
    text: "text-warning-muted-foreground",
    bg: "bg-warning-muted",
  },
  /** KDA >= 4 - Very Good */
  veryGood: {
    text: "text-success-muted-foreground",
    bg: "bg-success-muted",
  },
  /** KDA >= 3 - Good */
  good: {
    text: "text-info-muted-foreground",
    bg: "bg-info-muted",
  },
  /** KDA >= 2 - Average */
  average: {
    text: "text-muted-foreground",
    bg: "bg-muted",
  },
  /** KDA < 2 - Poor */
  poor: {
    text: "text-danger-muted-foreground",
    bg: "bg-danger-muted",
  },
} as const;

export type KdaLevel = keyof typeof KDA_STYLES;

export function getKdaLevel(kda: number): KdaLevel {
  if (kda >= 5) return "excellent";
  if (kda >= 4) return "veryGood";
  if (kda >= 3) return "good";
  if (kda >= 2) return "average";
  return "poor";
}

export function getKdaTextClass(kda: number): string {
  return KDA_STYLES[getKdaLevel(kda)].text;
}

// ============================================================================
// RÉSULTAT DE MATCH (Victoire / Défaite)
// ============================================================================

export const MATCH_RESULT_STYLES = {
  victory: {
    bg: "bg-info-muted",
    bgSubtle: "bg-info-muted/30",
    border: "border-info/20",
    text: "text-info-muted-foreground",
    accent: "bg-info",
  },
  defeat: {
    bg: "bg-danger-muted",
    bgSubtle: "bg-danger-muted/30",
    border: "border-danger/20",
    text: "text-danger-muted-foreground",
    accent: "bg-danger",
  },
} as const;

export type MatchResult = keyof typeof MATCH_RESULT_STYLES;

// ============================================================================
// STATUTS (Jobs, API, etc.)
// ============================================================================

export const STATUS_STYLES = {
  success: {
    icon: "text-success-muted-foreground",
    bg: "bg-success-muted",
    border: "border-success/30",
    text: "text-success-muted-foreground",
  },
  error: {
    icon: "text-danger-muted-foreground",
    bg: "bg-danger-muted",
    border: "border-danger/30",
    text: "text-danger-muted-foreground",
  },
  warning: {
    icon: "text-warning-muted-foreground",
    bg: "bg-warning-muted",
    border: "border-warning/30",
    text: "text-warning-muted-foreground",
  },
  info: {
    icon: "text-info-muted-foreground",
    bg: "bg-info-muted",
    border: "border-info/30",
    text: "text-info-muted-foreground",
  },
  pending: {
    icon: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
    text: "text-muted-foreground",
  },
} as const;

export type StatusType = keyof typeof STATUS_STYLES;

// ============================================================================
// SÉVÉRITÉ (Alertes, incidents)
// ============================================================================

export const SEVERITY_STYLES = {
  critical: {
    bg: "bg-danger-muted",
    border: "border-danger/30",
    text: "text-danger-muted-foreground",
    icon: "text-danger",
  },
  major: {
    bg: "bg-warning-muted",
    border: "border-warning/30",
    text: "text-warning-muted-foreground",
    icon: "text-warning",
  },
  minor: {
    bg: "bg-info-muted",
    border: "border-info/30",
    text: "text-info-muted-foreground",
    icon: "text-info",
  },
  none: {
    bg: "bg-success-muted",
    border: "border-success/30",
    text: "text-success-muted-foreground",
    icon: "text-success",
  },
} as const;

export type SeverityLevel = keyof typeof SEVERITY_STYLES;

// ============================================================================
// PHASES DE JEU (Early, Mid, Late)
// ============================================================================

export const GAME_PHASE_STYLES = {
  early: {
    bg: "bg-info-muted",
    border: "border-info/30",
    text: "text-info-muted-foreground",
  },
  mid: {
    bg: "bg-warning-muted",
    border: "border-warning/30",
    text: "text-warning-muted-foreground",
  },
  late: {
    bg: "bg-danger-muted",
    border: "border-danger/30",
    text: "text-danger-muted-foreground",
  },
} as const;

export type GamePhase = keyof typeof GAME_PHASE_STYLES;

// ============================================================================
// MAÎTRISE DE CHAMPION
// ============================================================================

export const MASTERY_STYLES: Record<number, { bg: string; text: string; border: string }> = {
  7: {
    bg: "bg-warning-muted",
    text: "text-warning-muted-foreground",
    border: "border-warning/30",
  },
  6: {
    bg: "bg-[hsl(300,60%,95%)] dark:bg-[hsl(300,30%,20%)]",
    text: "text-[hsl(300,60%,40%)] dark:text-[hsl(300,60%,70%)]",
    border: "border-[hsl(300,60%,70%)]/30",
  },
  5: {
    bg: "bg-danger-muted",
    text: "text-danger-muted-foreground",
    border: "border-danger/30",
  },
  4: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  },
  3: {
    bg: "bg-success-muted",
    text: "text-success-muted-foreground",
    border: "border-success/30",
  },
  2: {
    bg: "bg-info-muted",
    text: "text-info-muted-foreground",
    border: "border-info/30",
  },
  1: {
    bg: "bg-muted/50",
    text: "text-muted-foreground",
    border: "border-border/50",
  },
};

// ============================================================================
// PROBABILITÉ / CONFIANCE
// ============================================================================

export const PROBABILITY_STYLES = {
  /** >= 70% */
  high: {
    bg: "bg-success-muted",
    text: "text-success-muted-foreground",
    border: "border-success/30",
  },
  /** >= 50% */
  medium: {
    bg: "bg-warning-muted",
    text: "text-warning-muted-foreground",
    border: "border-warning/30",
  },
  /** < 50% */
  low: {
    bg: "bg-danger-muted",
    text: "text-danger-muted-foreground",
    border: "border-danger/30",
  },
} as const;

export type ProbabilityLevel = keyof typeof PROBABILITY_STYLES;

export function getProbabilityLevel(probability: number): ProbabilityLevel {
  if (probability >= 0.7) return "high";
  if (probability >= 0.5) return "medium";
  return "low";
}

// ============================================================================
// SCORE DE BUILD (Analyse de build)
// ============================================================================

export const BUILD_SCORE_STYLES = {
  /** >= 80% - Excellent build */
  excellent: {
    bg: "bg-success-muted",
    text: "text-success-muted-foreground",
    border: "border-success/30",
  },
  /** >= 60% - Good build */
  good: {
    bg: "bg-info-muted",
    text: "text-info-muted-foreground",
    border: "border-info/30",
  },
  /** >= 40% - Average build */
  average: {
    bg: "bg-warning-muted",
    text: "text-warning-muted-foreground",
    border: "border-warning/30",
  },
  /** < 40% - Needs improvement */
  poor: {
    bg: "bg-danger-muted",
    text: "text-danger-muted-foreground",
    border: "border-danger/30",
  },
} as const;

export type BuildScoreLevel = keyof typeof BUILD_SCORE_STYLES;

export function getBuildScoreLevel(score: number): BuildScoreLevel {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "average";
  return "poor";
}

// ============================================================================
// INSIGHTS (AI Analysis)
// ============================================================================

export const INSIGHT_STYLES = {
  strength: {
    icon: "text-success-muted-foreground",
    bg: "bg-success-muted/50",
    border: "border-success/20",
    hoverBorder: "hover:border-success/40",
  },
  weakness: {
    icon: "text-danger-muted-foreground",
    bg: "bg-danger-muted/50",
    border: "border-danger/20",
    hoverBorder: "hover:border-danger/40",
  },
  tip: {
    icon: "text-info-muted-foreground",
    bg: "bg-info-muted/50",
    border: "border-info/20",
    hoverBorder: "hover:border-info/40",
  },
} as const;

export type InsightType = keyof typeof INSIGHT_STYLES;

// ============================================================================
// PERFORMANCE LEVELS
// ============================================================================

export const PERFORMANCE_STYLES = {
  excellent: {
    bg: "bg-success",
    text: "text-success-foreground",
  },
  good: {
    bg: "bg-info",
    text: "text-info-foreground",
  },
  average: {
    bg: "bg-warning",
    text: "text-warning-foreground",
  },
  poor: {
    bg: "bg-danger",
    text: "text-danger-foreground",
  },
} as const;

export type PerformanceLevel = keyof typeof PERFORMANCE_STYLES;

export function getPerformanceLevel(performance: string): PerformanceLevel {
  switch (performance) {
    case "excellent": return "excellent";
    case "good": return "good";
    case "average": return "average";
    case "poor": return "poor";
    default: return "average";
  }
}
