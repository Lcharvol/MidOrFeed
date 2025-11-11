"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StatTile } from "./stat-tile";

type HeroMetric = {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  emphasis?: "neutral" | "positive" | "warning" | "danger" | "info";
  variant?: "solid" | "subtle";
};

type PageHeroProps = {
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  metaItems?: ReactNode[];
  metrics?: HeroMetric[];
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export const PageHero = ({
  title,
  description,
  badge,
  metaItems,
  metrics,
  children,
  className,
  contentClassName,
}: PageHeroProps) => (
  <section
    className={cn(
      "rounded-2xl border bg-background/60 p-6 shadow-sm",
      className
    )}
  >
    <div
      className={cn(
        "flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between",
        contentClassName
      )}
    >
      <div className="space-y-4">
        {badge}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {metaItems && metaItems.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {metaItems.map((item, index) => (
              <span key={index}>{item}</span>
            ))}
          </div>
        ) : null}
      </div>

      {children ??
        (metrics && metrics.length > 0 ? (
          <div className="grid w-full max-w-xl grid-cols-2 gap-4 sm:grid-cols-3">
            {metrics.map(
              ({ label, value, hint, icon, emphasis, variant }, index) => (
                <StatTile
                  key={index}
                  label={label}
                  value={value}
                  hint={hint}
                  icon={icon}
                  emphasis={emphasis}
                  variant={variant ?? "solid"}
                  align="center"
                />
              )
            )}
          </div>
        ) : null)}
    </div>
  </section>
);
