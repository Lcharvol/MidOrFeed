"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckIcon,
  CrownIcon,
  Loader2Icon,
  XIcon,
  ZapIcon,
  HomeIcon,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = async (_tier?: "free" | "premium") => {
    if (!user) {
      router.push("/login");
      return;
    }
    toast.info(t("pricing.premiumUnavailable"));
  };

  const isPremium = false;

  return (
    <div className="container mx-auto py-20 px-4">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/"><HomeIcon className="size-4" /></Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("pricing.breadcrumb")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="text-center mb-16 animate-fade-up">
        <h1 className="text-5xl font-bold mb-4">{t("pricing.title")}</h1>
        <p className="text-xl text-muted-foreground">
          {t("pricing.subtitle")}
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_1.15fr] gap-8 max-w-4xl mx-auto items-start">
        {/* Free Plan */}
        <Card className="relative animate-fade-up">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center">
                <ZapIcon className="size-8 text-muted-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {t("subscription.freeTitle")}
            </CardTitle>
            <div className="my-4">
              <span className="text-5xl font-bold">
                {t("subscription.freePrice")}
              </span>
              <span className="text-muted-foreground">
                {" "}
                / {t("subscription.freePeriod")}
              </span>
            </div>
            <CardDescription>{t("subscription.freeLimit")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <CheckIcon className="size-5 text-success" />
                <span>{t("pricing.freeAnalyses")}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-5 text-success" />
                <span>{t("pricing.basicStats")}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-5 text-success" />
                <span>{t("pricing.tierListAccess")}</span>
              </li>
              <li className="flex items-center gap-2">
                <XIcon className="size-5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {t("pricing.unlimitedAnalyses")}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <XIcon className="size-5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {t("pricing.aiCoaching")}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <XIcon className="size-5 text-muted-foreground" />
                <span className="text-muted-foreground">{t("pricing.inGameAssistant")}</span>
              </li>
            </ul>
            <Button className="w-full" variant="default" disabled>
              {t("pricing.currentPlanButton")}
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan — visually prominent */}
        <Card className="border-primary relative shadow-glow animate-fade-up-delay-1">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge variant="default">
              {isPremium ? t("subscription.currentPlan") : t("subscription.premiumTitle")}
            </Badge>
          </div>
          <CardHeader className="text-center pt-8">
            <div className="mb-4 flex justify-center">
              <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center">
                <CrownIcon className="size-10 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {t("subscription.premiumTitle")}
            </CardTitle>
            <div className="my-4">
              <span className="text-5xl font-bold">
                {t("subscription.premiumPrice")}
              </span>
              <span className="text-muted-foreground">
                {" "}
                / {t("subscription.premiumPeriod")}
              </span>
            </div>
            <CardDescription>{t("subscription.premiumLimit")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <CheckIcon className="size-5 text-success" />
                <span>{t("pricing.unlimitedAnalyses")}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-5 text-success" />
                <span>{t("pricing.advancedStats")}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-5 text-success" />
                <span>{t("pricing.tierListSynergies")}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-5 text-success" />
                <span>{t("pricing.aiCoaching")}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-5 text-success" />
                <span>{t("pricing.realtimeAssistant")}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-5 text-success" />
                <span>{t("pricing.aiCompositions")}</span>
              </li>
            </ul>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => handleUpgrade()}
              disabled
            >
              {t("pricing.unavailable")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
          {t("pricing.faqTitle")}
        </h2>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("pricing.faqChangePlan")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("pricing.faqChangePlanAnswer")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {t("pricing.faqResetAnalyses")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("pricing.faqResetAnalysesAnswer")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("pricing.faqCommitment")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t("pricing.faqCommitmentAnswer")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
