"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrophyIcon,
  TrendingUpIcon,
  UsersIcon,
  ZapIcon,
  ShieldIcon,
  SwordIcon,
  BookIcon,
  BarChart3Icon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/50 to-background py-20 md:py-32">
        <div className="relative z-10 px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-6" variant="secondary">
              {t("home.leagueOfLegends")}
            </Badge>
            <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
              {t("home.createComposition")}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {" "}
                {t("home.perfect")}
              </span>
            </h1>
            <p className="mb-8 text-xl text-muted-foreground md:text-2xl">
              {t("home.subtitle")}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="text-lg" asChild>
                <Link href="/tier-list/champions">
                  {t("home.viewChampions")}
                  <ZapIcon className="ml-2 size-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg" asChild>
                <Link href="/tier-list/items">
                  {t("home.exploreItems")}
                  <SwordIcon className="ml-2 size-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute inset-0 -z-0">
          <div className="absolute left-1/4 top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute right-1/4 bottom-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="px-20">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              {t("home.allFeaturesToPerform")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("home.completeTool")}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <TrophyIcon className="size-6 text-primary" />
                </div>
                <CardTitle>{t("home.tierListsCurrent")}</CardTitle>
                <CardDescription>{t("home.consultRankings")}</CardDescription>
              </CardHeader>
            </Card>

            <Card className="group transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <TrendingUpIcon className="size-6 text-primary" />
                </div>
                <CardTitle>{t("home.metaAnalysis")}</CardTitle>
                <CardDescription>{t("home.identifyBestPicks")}</CardDescription>
              </CardHeader>
            </Card>

            <Card className="group transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <ShieldIcon className="size-6 text-primary" />
                </div>
                <CardTitle>{t("home.detailedStats")}</CardTitle>
                <CardDescription>{t("home.accessAllData")}</CardDescription>
              </CardHeader>
            </Card>

            <Card className="group transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <BarChart3Icon className="size-6 text-primary" />
                </div>
                <CardTitle>{t("home.comparisons")}</CardTitle>
                <CardDescription>{t("home.compareStrengths")}</CardDescription>
              </CardHeader>
            </Card>

            <Card className="group transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <BookIcon className="size-6 text-primary" />
                </div>
                <CardTitle>{t("home.strategicGuides")}</CardTitle>
                <CardDescription>
                  {t("home.learnBestPractices")}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <UsersIcon className="size-6 text-primary" />
                </div>
                <CardTitle>{t("home.community")}</CardTitle>
                <CardDescription>{t("home.shareCompositions")}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30 py-16">
        <div className="px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">171</div>
              <div className="text-muted-foreground">
                {t("home.championsAvailable")}
              </div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">635+</div>
              <div className="text-muted-foreground">
                {t("home.itemsAnalyzed")}
              </div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">24/7</div>
              <div className="text-muted-foreground">
                {t("home.updateContinuous")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              {t("home.readyToDominate")}
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              {t("home.joinCommunity")}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/signup">
                  {t("home.createAccount")}
                  <ZapIcon className="ml-2 size-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">{t("home.signIn")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
