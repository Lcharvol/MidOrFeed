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
    <section className="py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-3">
          <Card variant="interactive">
            <CardHeader>
              <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-info-muted">
                <BrainIcon className="size-5 text-info" />
              </div>
              <CardTitle className="text-lg">{t("home.matchAnalysis")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("home.matchAnalysisDescription")}
              </p>
            </CardContent>
          </Card>

          <Card variant="interactive">
            <CardHeader>
              <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-success-muted">
                <UsersIcon className="size-5 text-success" />
              </div>
              <CardTitle className="text-lg">{t("home.teamCoaching")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("home.teamCoachingDescription")}
              </p>
            </CardContent>
          </Card>

          <Card variant="interactive">
            <CardHeader>
              <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-warning-muted">
                <TrophyIcon className="size-5 text-warning" />
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
