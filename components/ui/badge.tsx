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
    solid: "bg-success text-success-foreground border-success/80",
    subtle: "bg-success-muted text-success-muted-foreground border-success/30",
    outline: "border-success/50 text-success-muted-foreground",
  },
  warning: {
    solid: "bg-warning text-warning-foreground border-warning/80",
    subtle: "bg-warning-muted text-warning-muted-foreground border-warning/30",
    outline: "border-warning/50 text-warning-muted-foreground",
  },
  danger: {
    solid: "bg-danger text-danger-foreground border-danger/80",
    subtle: "bg-danger-muted text-danger-muted-foreground border-danger/30",
    outline: "border-danger/50 text-danger-muted-foreground",
  },
  info: {
    solid: "bg-info text-info-foreground border-info/80",
    subtle: "bg-info-muted text-info-muted-foreground border-info/30",
    outline: "border-info/50 text-info-muted-foreground",
  },
};

const badgeVariants = cva(
  "inline-flex items-center justify-center border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-primary/20 bg-primary/15 text-primary hover:bg-primary/20 rounded-full",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 rounded-full",
        destructive:
          "border-danger/20 bg-danger-muted text-danger-muted-foreground hover:bg-danger/20 focus-visible:ring-danger/20 rounded-full",
        outline:
          "border border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-full",
        info: "border-info/20 bg-info-muted text-info-muted-foreground rounded-full",
        warning: "border-warning/20 bg-warning-muted text-warning-muted-foreground rounded-full",
        success: "border-success/20 bg-success-muted text-success-muted-foreground rounded-full",
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
