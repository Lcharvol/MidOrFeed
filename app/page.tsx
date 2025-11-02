"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BrainIcon,
  BarChart3Icon,
  LightbulbIcon,
  UsersIcon,
  TrophyIcon,
  ZapIcon,
  SparklesIcon,
  TargetIcon,
  TrendingUpIcon,
  MessageSquareIcon,
  ArrowRightIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b py-20 md:py-32">
        {/* Background Image */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/home_background.png"
            alt="League of Legends Background"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
        </div>

        <div className="relative z-10 px-4">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6" variant="secondary">
              <BrainIcon className="mr-2 size-3" />
              {t("home.poweredByAI")}
            </Badge>
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-white md:text-7xl">
              {t("home.aiCoach")}{" "}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
                {t("home.dominateRift")}
              </span>
            </h1>
            <p className="mb-8 text-xl text-muted-foreground md:text-2xl">
              {t("home.subtitle")}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="text-lg" asChild>
                <Link href="/signup">
                  {t("home.getStarted")}
                  <ArrowRightIcon className="ml-2 size-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg bg-background/90 backdrop-blur hover:bg-background"
                asChild
              >
                <Link href="/login">{t("home.learnMore")}</Link>
              </Button>
            </div>

            {/* Quick Stats in Hero */}
            <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-primary">
                  2.5M+
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("home.matchesAnalyzed")}
                </div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-primary">50K+</div>
                <div className="text-sm text-muted-foreground">
                  {t("home.playersCoached")}
                </div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-primary">23%</div>
                <div className="text-sm text-muted-foreground">
                  {t("home.rankBoost")}
                </div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-primary">10M+</div>
                <div className="text-sm text-muted-foreground">
                  {t("home.aiInsights")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features - AI Focused */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              {t("home.allFeaturesToPerform")}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {t("home.completeTool")}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group border-2 transition-all hover:border-primary/50 hover:shadow-xl">
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <BarChart3Icon className="size-6 text-primary" />
                </div>
                <CardTitle className="text-xl">
                  {t("home.statsAnalysis")}
                </CardTitle>
                <CardDescription className="text-base">
                  {t("home.statsDescription")}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group border-2 transition-all hover:border-primary/50 hover:shadow-xl">
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <LightbulbIcon className="size-6 text-primary" />
                </div>
                <CardTitle className="text-xl">
                  {t("home.personalizedSuggestions")}
                </CardTitle>
                <CardDescription className="text-base">
                  {t("home.suggestionsDescription")}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group border-2 transition-all hover:border-primary/50 hover:shadow-xl">
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <TargetIcon className="size-6 text-primary" />
                </div>
                <CardTitle className="text-xl">
                  {t("home.soloQueueCoaching")}
                </CardTitle>
                <CardDescription className="text-base">
                  {t("home.soloCoachingDescription")}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group border-2 transition-all hover:border-primary/50 hover:shadow-xl">
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <UsersIcon className="size-6 text-primary" />
                </div>
                <CardTitle className="text-xl">
                  {t("home.teamCoaching")}
                </CardTitle>
                <CardDescription className="text-base">
                  {t("home.teamCoachingDescription")}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group border-2 transition-all hover:border-primary/50 hover:shadow-xl">
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <MessageSquareIcon className="size-6 text-primary" />
                </div>
                <CardTitle className="text-xl">
                  {t("home.inGameAssistant")}
                </CardTitle>
                <CardDescription className="text-base">
                  {t("home.assistantDescription")}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group border-2 transition-all hover:border-primary/50 hover:shadow-xl">
              <CardHeader>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <TrendingUpIcon className="size-6 text-primary" />
                </div>
                <CardTitle className="text-xl">
                  {t("home.matchAnalysis")}
                </CardTitle>
                <CardDescription className="text-base">
                  {t("home.matchAnalysisDescription")}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-y bg-gradient-to-b from-muted/30 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              {t("homeHowItWorks.title")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("homeHowItWorks.subtitle")}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
                  <TrophyIcon className="size-10 text-primary" />
                </div>
              </div>
              <h3 className="mb-3 text-xl font-bold">
                1. {t("homeHowItWorks.step1")}
              </h3>
              <p className="text-muted-foreground">
                {t("homeHowItWorks.step1Description")}
              </p>
            </div>

            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
                  <BrainIcon className="size-10 text-primary" />
                </div>
              </div>
              <h3 className="mb-3 text-xl font-bold">
                2. {t("homeHowItWorks.step2")}
              </h3>
              <p className="text-muted-foreground">
                {t("homeHowItWorks.step2Description")}
              </p>
            </div>

            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
                  <SparklesIcon className="size-10 text-primary" />
                </div>
              </div>
              <h3 className="mb-3 text-xl font-bold">
                3. {t("homeHowItWorks.step3")}
              </h3>
              <p className="text-muted-foreground">
                {t("homeHowItWorks.step3Description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5 p-12 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                {t("home.readyToImprove")}
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                {t("home.joinAIRevolution")}
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" className="text-lg" asChild>
                  <Link href="/signup">
                    {t("home.startFree")}
                    <ZapIcon className="ml-2 size-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg" asChild>
                  <Link href="/login">{t("home.signIn")}</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {t("home.noCreditCard")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
