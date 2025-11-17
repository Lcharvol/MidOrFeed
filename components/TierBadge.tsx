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

const getTierStyles = (
  tier: string,
  variant: "solid" | "subtle" | "outline"
) => {
  const baseStyles =
    "relative inline-flex items-center justify-center font-bold uppercase tracking-wider transition-all duration-200 overflow-hidden";

  if (tier === "S+") {
    return cn(
      baseStyles,
      "bg-gradient-to-br from-emerald-500 via-emerald-400 to-emerald-600",
      "text-emerald-50",
      "border-2 border-emerald-300/50",
      "shadow-[0_0_20px_rgba(16,185,129,0.4),0_4px_12px_rgba(0,0,0,0.15)]",
      "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full before:animate-shine",
      variant === "subtle" && "opacity-90",
      variant === "outline" &&
        "bg-transparent text-emerald-400 border-emerald-400/60 shadow-none"
    );
  }

  if (tier === "S") {
    return cn(
      baseStyles,
      "bg-gradient-to-br from-emerald-400 via-emerald-300 to-emerald-500",
      "text-emerald-950",
      "border-2 border-emerald-200/50",
      "shadow-[0_0_16px_rgba(16,185,129,0.3),0_4px_8px_rgba(0,0,0,0.1)]",
      "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent before:-translate-x-full before:animate-shine",
      variant === "subtle" && "opacity-85",
      variant === "outline" &&
        "bg-transparent text-emerald-400 border-emerald-400/50 shadow-none"
    );
  }

  if (tier === "A") {
    return cn(
      baseStyles,
      "bg-gradient-to-br from-sky-500/90 via-sky-400/90 to-sky-600/90",
      "text-sky-50",
      "border-2 border-sky-300/40",
      "shadow-[0_0_12px_rgba(14,165,233,0.25),0_2px_8px_rgba(0,0,0,0.1)]",
      variant === "subtle" && "opacity-80",
      variant === "outline" &&
        "bg-transparent text-sky-400 border-sky-400/50 shadow-none"
    );
  }

  if (tier === "B") {
    return cn(
      baseStyles,
      "bg-gradient-to-br from-muted via-muted/95 to-muted",
      "text-foreground",
      "border-2 border-border/60",
      "shadow-[0_2px_6px_rgba(0,0,0,0.08)]",
      variant === "subtle" && "opacity-70",
      variant === "outline" &&
        "bg-transparent text-muted-foreground border-border shadow-none"
    );
  }

  if (tier === "C") {
    return cn(
      baseStyles,
      "bg-gradient-to-br from-amber-500/90 via-amber-400/90 to-amber-600/90",
      "text-amber-950",
      "border-2 border-amber-300/40",
      "shadow-[0_0_10px_rgba(245,158,11,0.2),0_2px_6px_rgba(0,0,0,0.1)]",
      variant === "subtle" && "opacity-75",
      variant === "outline" &&
        "bg-transparent text-amber-500 border-amber-500/50 shadow-none"
    );
  }

  if (tier === "D") {
    return cn(
      baseStyles,
      "bg-gradient-to-br from-rose-500/90 via-rose-400/90 to-rose-600/90",
      "text-rose-50",
      "border-2 border-rose-300/40",
      "shadow-[0_0_10px_rgba(244,63,94,0.2),0_2px_6px_rgba(0,0,0,0.1)]",
      variant === "subtle" && "opacity-70",
      variant === "outline" &&
        "bg-transparent text-rose-400 border-rose-400/50 shadow-none"
    );
  }

  // Default for "-" or unknown tiers
  return cn(
    baseStyles,
    "bg-muted/50 text-muted-foreground border-2 border-border/40 shadow-none",
    variant === "outline" && "bg-transparent border-border/60"
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
        isPremium && "hover:shadow-[0_0_24px_rgba(16,185,129,0.5)]",
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
