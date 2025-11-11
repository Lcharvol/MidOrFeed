"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Emphasis = "neutral" | "positive" | "warning" | "danger" | "info";
type Variant = "subtle" | "solid";

type StatTileProps = {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  align?: "start" | "center" | "end";
  emphasis?: Emphasis;
  variant?: Variant;
  dense?: boolean;
  className?: string;
  contentClassName?: string;
};

const emphasisToContainerClasses: Record<Variant, Record<Emphasis, string>> = {
  solid: {
    neutral: "bg-background/80 border-border/60",
    positive:
      "bg-emerald-500/15 border-emerald-500/30 text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.20)]",
    warning: "bg-amber-500/15 border-amber-500/30 text-amber-50",
    danger: "bg-rose-500/20 border-rose-500/25 text-rose-50",
    info: "bg-sky-500/15 border-sky-500/25 text-sky-50",
  },
  subtle: {
    neutral: "bg-muted/25 border-border/60 backdrop-blur-sm",
    positive: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-500",
    danger: "bg-rose-500/10 border-rose-500/30 text-rose-400",
    info: "bg-sky-500/10 border-sky-500/25 text-sky-400",
  },
};

const labelColorByEmphasis: Record<Emphasis, string> = {
  neutral: "text-muted-foreground",
  positive: "text-emerald-300/90",
  warning: "text-amber-300/90",
  danger: "text-rose-200/90",
  info: "text-sky-200/90",
};

const valueColorByEmphasis: Record<Emphasis, string> = {
  neutral: "text-foreground",
  positive: "text-emerald-50",
  warning: "text-amber-50",
  danger: "text-rose-50",
  info: "text-sky-50",
};

const hintColorByEmphasis: Record<Emphasis, string> = {
  neutral: "text-muted-foreground/80",
  positive: "text-emerald-100/80",
  warning: "text-amber-100/80",
  danger: "text-rose-100/80",
  info: "text-sky-100/80",
};

export const StatTile = ({
  label,
  value,
  hint,
  icon,
  align = "start",
  emphasis = "neutral",
  variant = "subtle",
  dense = false,
  className,
  contentClassName,
}: StatTileProps) => {
  const alignment =
    align === "center"
      ? "items-center text-center"
      : align === "end"
      ? "items-end text-right"
      : "items-start text-left";

  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-xl border shadow-sm transition",
        emphasisToContainerClasses[variant][emphasis],
        className
      )}
    >
      <CardContent
        className={cn(
          "flex w-full gap-3",
          dense ? "p-3" : "p-4",
          icon ? "flex-row items-center" : "flex-col",
          alignment,
          contentClassName
        )}
      >
        {icon && <div className="shrink-0 text-muted-foreground">{icon}</div>}
        <div className={cn("flex flex-col gap-1", alignment)}>
          <span
            className={cn(
              "text-xs font-medium uppercase tracking-wide",
              labelColorByEmphasis[emphasis]
            )}
          >
            {label}
          </span>
          <span
            className={cn(
              "text-2xl font-semibold leading-tight",
              valueColorByEmphasis[emphasis]
            )}
          >
            {value}
          </span>
          {hint ? (
            <span
              className={cn(
                "text-xs leading-relaxed",
                hintColorByEmphasis[emphasis]
              )}
            >
              {hint}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};
