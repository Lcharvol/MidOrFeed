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
  const getColorClasses = () => {
    if (matchScore >= 80) {
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
    if (matchScore >= 60) {
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    }
    if (matchScore >= 40) {
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    }
    return "bg-orange-500/15 text-orange-400 border-orange-500/30";
  };

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
              <p className="text-xs font-medium text-orange-400">
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
                    className="border-orange-500/50"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Common items for this champion */}
          {commonItems.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-emerald-400">
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
                                ? "border-emerald-500/50 ring-1 ring-emerald-500/30"
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
