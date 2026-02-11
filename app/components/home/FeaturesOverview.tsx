"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BrainIcon,
  UsersIcon,
  TrophyIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

export const FeaturesOverview = () => {
  const { t } = useI18n();

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="group border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <BrainIcon className="size-5 text-primary" />
              </div>
              <CardTitle className="text-lg">{t("home.matchAnalysis")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("home.matchAnalysisDescription")}
              </p>
            </CardContent>
          </Card>

          <Card className="group border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <UsersIcon className="size-5 text-primary" />
              </div>
              <CardTitle className="text-lg">{t("home.teamCoaching")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("home.teamCoachingDescription")}
              </p>
            </CardContent>
          </Card>

          <Card className="group border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <TrophyIcon className="size-5 text-primary" />
              </div>
              <CardTitle className="text-lg">{t("home.soloQueueCoaching")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("home.soloCoachingDescription")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
