"use client";

import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
} from "lucide-react";

export const TrendIcon = ({ trend }: { trend?: "up" | "down" | "stable" | null }) => {
  if (!trend || trend === "stable") {
    return <MinusIcon className="size-3 text-muted-foreground" />;
  }
  if (trend === "up") {
    return <TrendingUpIcon className="size-3 text-win" />;
  }
  return <TrendingDownIcon className="size-3 text-loss" />;
};
