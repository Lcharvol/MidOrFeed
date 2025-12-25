"use client";

import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

export type TierValue = "S+" | "S" | "A" | "B" | "C" | "D" | "-";

type TierBadgeProps = {
  tier: TierValue | string;
  variant?: "solid" | "subtle" | "outline";
  className?: string;
  size?: "sm" | "md" | "lg";
};

// Tier color mappings using semantic theme colors
type TierColorConfig = {
  solid: string;
  subtle: string;
  outline: string;
  shadow: string;
};

const tierColors: Record<string, TierColorConfig> = {
  "S+": {
    solid: "bg-success text-success-foreground border-success/50",
    subtle: "bg-success-muted text-success-muted-foreground border-success/30",
    outline: "bg-transparent text-success border-success/60",
    shadow: "shadow-[0_0_20px_var(--success)/0.4,0_4px_12px_rgba(0,0,0,0.15)]",
  },
  S: {
    solid: "bg-success text-success-foreground border-success/40",
    subtle: "bg-success-muted text-success-muted-foreground border-success/25",
    outline: "bg-transparent text-success border-success/50",
    shadow: "shadow-[0_0_16px_var(--success)/0.3,0_4px_8px_rgba(0,0,0,0.1)]",
  },
  A: {
    solid: "bg-info text-info-foreground border-info/40",
    subtle: "bg-info-muted text-info-muted-foreground border-info/30",
    outline: "bg-transparent text-info border-info/50",
    shadow: "shadow-[0_0_12px_var(--info)/0.25,0_2px_8px_rgba(0,0,0,0.1)]",
  },
  B: {
    solid: "bg-muted text-foreground border-border/60",
    subtle: "bg-muted/50 text-muted-foreground border-border/40",
    outline: "bg-transparent text-muted-foreground border-border",
    shadow: "shadow-[0_2px_6px_rgba(0,0,0,0.08)]",
  },
  C: {
    solid: "bg-warning text-warning-foreground border-warning/40",
    subtle: "bg-warning-muted text-warning-muted-foreground border-warning/30",
    outline: "bg-transparent text-warning border-warning/50",
    shadow: "shadow-[0_0_10px_var(--warning)/0.2,0_2px_6px_rgba(0,0,0,0.1)]",
  },
  D: {
    solid: "bg-danger text-danger-foreground border-danger/40",
    subtle: "bg-danger-muted text-danger-muted-foreground border-danger/30",
    outline: "bg-transparent text-danger border-danger/50",
    shadow: "shadow-[0_0_10px_var(--danger)/0.2,0_2px_6px_rgba(0,0,0,0.1)]",
  },
  default: {
    solid: "bg-muted/50 text-muted-foreground border-border/40",
    subtle: "bg-muted/30 text-muted-foreground border-border/30",
    outline: "bg-transparent text-muted-foreground border-border/60",
    shadow: "shadow-none",
  },
};

const getTierStyles = (
  tier: string,
  variant: "solid" | "subtle" | "outline"
) => {
  const baseStyles =
    "relative inline-flex items-center justify-center font-bold uppercase tracking-wider transition-all duration-200 overflow-hidden border-2";

  const config = tierColors[tier] || tierColors.default;
  const isPremium = tier === "S+" || tier === "S";

  return cn(
    baseStyles,
    config[variant],
    variant !== "outline" && config.shadow,
    isPremium &&
      variant !== "outline" &&
      "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full before:animate-shine"
  );
};

const getSizeStyles = (size: "sm" | "md" | "lg") => {
  switch (size) {
    case "sm":
      return "px-2 py-0.5 text-[10px] rounded-md";
    case "lg":
      return "px-4 py-1.5 text-sm rounded-lg";
    default:
      return "px-3 py-1 text-xs rounded-md";
  }
};

export const TierBadge = ({
  tier,
  variant = "subtle",
  className,
  size = "md",
}: TierBadgeProps) => {
  const isPremium = tier === "S+" || tier === "S";
  const tierStyles = getTierStyles(tier, variant);
  const sizeStyles = getSizeStyles(size);

  return (
    <span
      className={cn(
        tierStyles,
        sizeStyles,
        "group",
        "hover:scale-105 hover:shadow-lg",
        isPremium && "hover:shadow-[0_0_24px_var(--success)/0.5]",
        className
      )}
      style={
        {
          "--shine-duration": "2s",
        } as CSSProperties
      }
    >
      <span className="relative z-10 flex items-center gap-1">
        {tier === "S+" && (
          <span className="text-[0.85em] animate-pulse" aria-hidden="true">
            ✦
          </span>
        )}
        <span>{tier === "S+" ? "S" : tier}</span>
      </span>

      {/* Shine effect overlay for premium tiers */}
      {isPremium && variant !== "outline" && (
        <span
          className="absolute inset-0 -translate-x-full pointer-events-none animate-[shine_2s_infinite]"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)",
          }}
          aria-hidden="true"
        />
      )}
    </span>
  );
};
