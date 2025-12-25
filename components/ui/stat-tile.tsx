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
    positive: "bg-success-muted border-success/30",
    warning: "bg-warning-muted border-warning/30",
    danger: "bg-danger-muted border-danger/30",
    info: "bg-info-muted border-info/30",
  },
  subtle: {
    neutral: "bg-muted/25 border-border/60 backdrop-blur-sm",
    positive: "bg-success-muted/50 border-success/20",
    warning: "bg-warning-muted/50 border-warning/20",
    danger: "bg-danger-muted/50 border-danger/20",
    info: "bg-info-muted/50 border-info/20",
  },
};

const labelColorByEmphasis: Record<Emphasis, string> = {
  neutral: "text-muted-foreground",
  positive: "text-success-muted-foreground/80",
  warning: "text-warning-muted-foreground/80",
  danger: "text-danger-muted-foreground/80",
  info: "text-info-muted-foreground/80",
};

const valueColorByEmphasis: Record<Emphasis, string> = {
  neutral: "text-foreground",
  positive: "text-success-muted-foreground",
  warning: "text-warning-muted-foreground",
  danger: "text-danger-muted-foreground",
  info: "text-info-muted-foreground",
};

const hintColorByEmphasis: Record<Emphasis, string> = {
  neutral: "text-muted-foreground/80",
  positive: "text-success-muted-foreground/70",
  warning: "text-warning-muted-foreground/70",
  danger: "text-danger-muted-foreground/70",
  info: "text-info-muted-foreground/70",
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
