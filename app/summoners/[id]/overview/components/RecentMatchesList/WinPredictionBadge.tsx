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
  // < 35%: red (low chance)
  // 35-50%: orange (below average)
  // 50-65%: yellow (average)
  // 65-80%: green (good chance)
  // > 80%: emerald (excellent chance)
  const getColorClasses = () => {
    if (percentage < 35) {
      return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    }
    if (percentage < 50) {
      return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    }
    if (percentage < 65) {
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    }
    if (percentage < 80) {
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
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
