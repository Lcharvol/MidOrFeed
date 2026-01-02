"use client";

import { BrainIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PROBABILITY_STYLES, getProbabilityLevel, STATUS_STYLES } from "@/lib/styles/game-colors";

interface WinPredictionBadgeProps {
  winProbability: number;
  className?: string;
}

/**
 * Displays the ML-predicted win probability as a compact badge
 * Color-coded based on the probability value
 */
export const WinPredictionBadge = ({
  winProbability,
  className,
}: WinPredictionBadgeProps) => {
  const { t } = useI18n();
  // Convert to percentage
  const percentage = Math.round(winProbability * 100);

  // Determine color based on probability
  const getColorClasses = () => {
    if (percentage < 35) {
      return cn(STATUS_STYLES.error.bg, STATUS_STYLES.error.text, STATUS_STYLES.error.border);
    }
    if (percentage < 50) {
      return cn(STATUS_STYLES.warning.bg, STATUS_STYLES.warning.text, STATUS_STYLES.warning.border);
    }
    if (percentage < 65) {
      return cn(STATUS_STYLES.warning.bg, STATUS_STYLES.warning.text, STATUS_STYLES.warning.border);
    }
    const level = getProbabilityLevel(winProbability);
    const style = PROBABILITY_STYLES[level];
    return cn(style.bg, style.text, style.border);
  };

  const getLabelKey = () => {
    if (percentage < 35) return "mlPrediction.difficult";
    if (percentage < 50) return "mlPrediction.uncertain";
    if (percentage < 65) return "mlPrediction.balanced";
    if (percentage < 80) return "mlPrediction.favorable";
    return "mlPrediction.dominant";
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors cursor-default",
              getColorClasses(),
              className
            )}
          >
            <BrainIcon className="size-3" />
            <span>{percentage}%</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="space-y-1">
            <p className="font-semibold">
              {t("mlPrediction.title")}: {t(getLabelKey())}
            </p>
            <p className="text-muted-foreground">
              {t("mlPrediction.winProbability")}: {percentage}%
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              {t("mlPrediction.basedOn")}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
