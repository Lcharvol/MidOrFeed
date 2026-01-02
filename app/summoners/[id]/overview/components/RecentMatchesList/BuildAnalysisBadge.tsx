"use client";

import { HammerIcon, CheckCircleIcon, AlertTriangleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import { useBuildAnalysis } from "@/lib/hooks/use-build-analysis";
import { ItemIcon } from "@/components/ItemIcon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BUILD_SCORE_STYLES, getBuildScoreLevel, STATUS_STYLES } from "@/lib/styles/game-colors";

interface BuildAnalysisBadgeProps {
  championId: string;
  items: number[];
  queueId?: number;
  className?: string;
}

/**
 * Displays a build analysis badge with popover showing detailed analysis
 * Compares player's build against optimal/winning builds
 */
export const BuildAnalysisBadge = ({
  championId,
  items,
  queueId,
  className,
}: BuildAnalysisBadgeProps) => {
  const { t } = useI18n();
  const { analysis, isLoading } = useBuildAnalysis(championId, items, queueId);

  // Don't show if no items or loading
  if (items.length === 0) {
    return null;
  }

  // While loading, show a subtle indicator
  if (isLoading) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-muted/30 text-muted-foreground border-border/30 animate-pulse",
          className
        )}
      >
        <HammerIcon className="size-3" />
        <span>...</span>
      </div>
    );
  }

  // Don't show if analysis failed or no data
  if (!analysis || analysis.gamesAnalyzed === 0) {
    return null;
  }

  const { matchScore, suggestions, unusualItems, commonItems, gamesAnalyzed } =
    analysis;

  // Determine color based on match score
  const scoreLevel = getBuildScoreLevel(matchScore);
  const scoreStyle = BUILD_SCORE_STYLES[scoreLevel];
  const getColorClasses = () => cn(scoreStyle.bg, scoreStyle.text, scoreStyle.border);

  const getScoreIcon = () => {
    if (matchScore >= 60) {
      return <CheckCircleIcon className="size-3" />;
    }
    return <AlertTriangleIcon className="size-3" />;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all cursor-pointer hover:brightness-110",
            getColorClasses(),
            className
          )}
        >
          {getScoreIcon()}
          <span>{matchScore}%</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" side="top" align="start">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <HammerIcon className="size-4" />
              {t("buildAnalysis.title")}
            </h4>
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                getColorClasses()
              )}
            >
              {matchScore}%
            </span>
          </div>

          {/* Score explanation */}
          <div className="text-xs text-muted-foreground">
            {t("buildAnalysis.analyzedGames").replace(
              "{count}",
              gamesAnalyzed.toString()
            )}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-1">
              {suggestions.map((suggestion, i) => (
                <p
                  key={i}
                  className="text-xs text-muted-foreground flex items-start gap-1.5"
                >
                  <span className="text-primary mt-0.5">•</span>
                  {suggestion}
                </p>
              ))}
            </div>
          )}

          {/* Unusual items */}
          {unusualItems.length > 0 && (
            <div className="space-y-1.5">
              <p className={cn("text-xs font-medium", STATUS_STYLES.warning.text)}>
                {t("buildAnalysis.unusualItems")}
              </p>
              <div className="flex gap-1 flex-wrap">
                {unusualItems.map((itemId) => (
                  <ItemIcon
                    key={itemId}
                    itemId={itemId}
                    alt={`Item ${itemId}`}
                    size={24}
                    shape="rounded"
                    showBorder
                    className={STATUS_STYLES.warning.border}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Common items for this champion */}
          {commonItems.length > 0 && (
            <div className="space-y-1.5">
              <p className={cn("text-xs font-medium", STATUS_STYLES.success.text)}>
                {t("buildAnalysis.coreItems")}
              </p>
              <div className="flex gap-1 flex-wrap">
                {commonItems.slice(0, 6).map((itemId) => (
                  <TooltipProvider key={itemId} delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <ItemIcon
                            itemId={itemId}
                            alt={`Item ${itemId}`}
                            size={24}
                            shape="rounded"
                            showBorder
                            className={cn(
                              items.includes(itemId)
                                ? cn(STATUS_STYLES.success.border, "ring-1 ring-success/30")
                                : "border-border/50 opacity-60"
                            )}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {items.includes(itemId)
                          ? t("buildAnalysis.youHaveThis")
                          : t("buildAnalysis.recommended")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
