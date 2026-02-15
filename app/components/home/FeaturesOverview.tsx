"use client";

import {
  BrainIcon,
  UsersIcon,
  TrophyIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

export const FeaturesOverview = () => {
  const { t } = useI18n();

  return (
    <section className="py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="grid gap-4 md:grid-cols-5">
          {/* Featured card — spans 3 columns */}
          <div className="animate-fade-up md:col-span-3 rounded-xl bg-muted/20 p-6 transition-colors hover:bg-muted/30">
            <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-info-muted">
              <BrainIcon className="size-6 text-info" />
            </div>
            <h3 className="text-xl font-bold">{t("home.matchAnalysis")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("home.matchAnalysisDescription")}
            </p>
          </div>

          {/* Secondary cards — each spans 2 columns */}
          <div className={cn("animate-fade-up-delay-1", "md:col-span-2 rounded-xl p-6 transition-colors hover:bg-muted/30")}>
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-success-muted">
              <UsersIcon className="size-5 text-success" />
            </div>
            <h3 className="font-semibold">{t("home.teamCoaching")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("home.teamCoachingDescription")}
            </p>
          </div>

          <div className={cn("animate-fade-up-delay-2", "md:col-span-2 rounded-xl p-6 transition-colors hover:bg-muted/30")}>
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-warning-muted">
              <TrophyIcon className="size-5 text-warning" />
            </div>
            <h3 className="font-semibold">{t("home.soloQueueCoaching")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("home.soloCoachingDescription")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
