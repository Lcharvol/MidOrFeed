"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Emphasis = "neutral" | "positive" | "warning" | "danger" | "info";

const emphasisToClasses: Record<
  Emphasis,
  Record<"solid" | "subtle" | "outline", string>
> = {
  neutral: {
    solid: "bg-muted text-foreground border-border/60",
    subtle: "bg-muted/30 text-muted-foreground border-border/50",
    outline: "border-border/60 text-muted-foreground",
  },
  positive: {
    solid:
      "bg-emerald-500 text-emerald-50 border-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.35)]",
    subtle:
      "bg-emerald-500/12 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
    outline: "border-emerald-500/50 text-emerald-400",
  },
  warning: {
    solid: "bg-amber-500 text-amber-950 border-amber-600",
    subtle: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    outline: "border-amber-500/40 text-amber-500",
  },
  danger: {
    solid: "bg-rose-500 text-rose-50 border-rose-600",
    subtle: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    outline: "border-rose-500/40 text-rose-400",
  },
  info: {
    solid: "bg-sky-500 text-sky-50 border-sky-600",
    subtle: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    outline: "border-sky-500/40 text-sky-400",
  },
};

const badgeVariants = cva(
  "inline-flex items-center justify-center border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-primary/20 bg-primary/15 text-primary hover:bg-primary/20 dark:text-primary-300 rounded-full",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 rounded-full",
        destructive:
          "border-red-500/20 bg-red-500/15 text-red-700 hover:bg-red-500/20 focus-visible:ring-red-500/20 dark:text-red-400 rounded-full",
        outline:
          "border border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-full",
        info: "border-blue-500/20 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-full",
        warning:
          "border-amber-500/20 bg-amber-500/15 text-amber-700 dark:text-amber-400 rounded-full",
        success:
          "border-emerald-500/20 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full",
        // Placeholder variants for ColorBadge compatibility (used with emphasis prop)
        solid: "",
        subtle: "",
      },
      rounded: {
        full: "rounded-full",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      rounded: "full",
    },
  }
);

type BadgeProps = React.ComponentProps<"span"> & {
  asChild?: boolean;
  // Standard badge variants
  variant?:
    | VariantProps<typeof badgeVariants>["variant"]
    | "solid"
    | "subtle"
    | "outline";
  rounded?: VariantProps<typeof badgeVariants>["rounded"];
  // ColorBadge compatibility (emphasis system)
  emphasis?: Emphasis;
  emphasisVariant?: "solid" | "subtle" | "outline";
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

function Badge({
  className,
  variant,
  rounded,
  asChild = false,
  emphasis,
  emphasisVariant,
  leadingIcon,
  trailingIcon,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span";

  // Si emphasis est fourni, utiliser le système d'emphasis (ancien ColorBadge)
  // Si variant est "solid", "subtle" ou "outline" avec emphasis, c'est un emphasisVariant
  const isEmphasisMode = emphasis !== undefined;
  const effectiveEmphasisVariant: "solid" | "subtle" | "outline" =
    isEmphasisMode &&
    (variant === "solid" || variant === "subtle" || variant === "outline")
      ? variant
      : emphasisVariant ?? "subtle";

  const emphasisClasses =
    isEmphasisMode && emphasis in emphasisToClasses
      ? emphasisToClasses[emphasis][effectiveEmphasisVariant]
      : null;

  // Si on utilise emphasis, ignorer rounded par défaut pour utiliser celui du système
  const effectiveRounded =
    rounded !== undefined
      ? rounded
      : isEmphasisMode
      ? "full" // Default pour emphasis
      : undefined;

  return (
    <Comp
      data-slot="badge"
      className={cn(
        emphasisClasses
          ? cn(
              "inline-flex items-center gap-2 border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition",
              effectiveRounded === "full"
                ? "rounded-full"
                : effectiveRounded === "xl"
                ? "rounded-xl"
                : effectiveRounded === "lg"
                ? "rounded-lg"
                : effectiveRounded === "md"
                ? "rounded-md"
                : "rounded-full",
              emphasisClasses
            )
          : badgeVariants({
              variant: isEmphasisMode ? undefined : variant,
              rounded: effectiveRounded,
            }),
        className
      )}
      {...props}
    >
      {leadingIcon ? <span className="text-[0.9em]">{leadingIcon}</span> : null}
      <span>{children}</span>
      {trailingIcon ? (
        <span className="text-[0.9em]">{trailingIcon}</span>
      ) : null}
    </Comp>
  );
}

// Alias pour rétrocompatibilité
export const ColorBadge = Badge;

export { Badge, badgeVariants };
