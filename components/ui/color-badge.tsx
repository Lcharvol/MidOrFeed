"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Emphasis = "neutral" | "positive" | "warning" | "danger" | "info";
type Variant = "solid" | "subtle" | "outline";

const emphasisToClasses: Record<Emphasis, Record<Variant, string>> = {
  neutral: {
    solid:
      "bg-muted text-foreground border-border/60",
    subtle:
      "bg-muted/30 text-muted-foreground border-border/50",
    outline:
      "border-border/60 text-muted-foreground",
  },
  positive: {
    solid:
      "bg-emerald-500 text-emerald-50 border-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.35)]",
    subtle:
      "bg-emerald-500/12 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
    outline:
      "border-emerald-500/50 text-emerald-400",
  },
  warning: {
    solid:
      "bg-amber-500 text-amber-950 border-amber-600",
    subtle:
      "bg-amber-500/15 text-amber-400 border-amber-500/30",
    outline:
      "border-amber-500/40 text-amber-500",
  },
  danger: {
    solid:
      "bg-rose-500 text-rose-50 border-rose-600",
    subtle:
      "bg-rose-500/15 text-rose-300 border-rose-500/30",
    outline:
      "border-rose-500/40 text-rose-400",
  },
  info: {
    solid:
      "bg-sky-500 text-sky-50 border-sky-600",
    subtle:
      "bg-sky-500/15 text-sky-300 border-sky-500/30",
    outline:
      "border-sky-500/40 text-sky-400",
  },
};

type ColorBadgeProps = {
  children: ReactNode;
  emphasis?: Emphasis;
  variant?: Variant;
  rounded?: "full" | "md" | "lg" | "xl";
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
};

export const ColorBadge = ({
  children,
  emphasis = "neutral",
  variant = "subtle",
  rounded = "full",
  leadingIcon,
  trailingIcon,
  className,
}: ColorBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-2 border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition",
      rounded === "full"
        ? "rounded-full"
        : rounded === "xl"
          ? "rounded-xl"
          : rounded === "lg"
            ? "rounded-lg"
            : "rounded-md",
      emphasisToClasses[emphasis][variant],
      className
    )}
  >
    {leadingIcon ? <span className="text-[0.9em]">{leadingIcon}</span> : null}
    <span>{children}</span>
    {trailingIcon ? <span className="text-[0.9em]">{trailingIcon}</span> : null}
  </span>
);


