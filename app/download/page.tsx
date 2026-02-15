"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DownloadIcon,
  MonitorIcon,
  AppleIcon,
  CheckCircleIcon,
  ZapIcon,
  ShieldIcon,
  EyeIcon,
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
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

type Platform = "windows" | "mac" | "unknown";

const GITHUB_REPO = "Lcharvol/lol-comp-maker";
const APP_VERSION = "1.0.0";

export default function DownloadPage() {
  const { t } = useI18n();
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleSilicon, setIsAppleSilicon] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("win")) {
      setPlatform("windows");
    } else if (userAgent.includes("mac")) {
      setPlatform("mac");
      // @ts-expect-error - userAgentData is not yet in TypeScript types
      if (navigator.userAgentData?.platform === "macOS") {
        // @ts-expect-error - userAgentData is not yet in TypeScript types
        navigator.userAgentData.getHighEntropyValues(["architecture"]).then((values: { architecture: string }) => {
          setIsAppleSilicon(values.architecture === "arm");
        }).catch(() => {});
      }
    }
  }, []);

  const getDownloadUrl = (targetPlatform: Platform, arch?: string) => {
    const baseUrl = `https://github.com/${GITHUB_REPO}/releases/download/v${APP_VERSION}`;
    if (targetPlatform === "windows") {
      return `${baseUrl}/MidOrFeed%20Overlay-${APP_VERSION}-Setup.exe`;
    } else if (targetPlatform === "mac") {
      const macArch = arch || (isAppleSilicon ? "arm64" : "x64");
      return `${baseUrl}/MidOrFeed%20Overlay-${APP_VERSION}-${macArch}.dmg`;
    }
    return "#";
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleDownload = (targetPlatform: Platform) => {
    setIsLoading(true);
    window.location.href = getDownloadUrl(targetPlatform);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsLoading(false), 2000);
  };

  const features = [
    {
      icon: ZapIcon,
      title: t("download.featureChampSelectTitle"),
      description: t("download.featureChampSelectDescription"),
      iconBg: "bg-warning-muted",
      iconColor: "text-warning",
    },
    {
      icon: EyeIcon,
      title: t("download.featureOverlayTitle"),
      description: t("download.featureOverlayDescription"),
      iconBg: "bg-info-muted",
      iconColor: "text-info",
    },
    {
      icon: ShieldIcon,
      title: t("download.featureSafeTitle"),
      description: t("download.featureSafeDescription"),
      iconBg: "bg-success-muted",
      iconColor: "text-success",
    },
  ];

  const steps = [
    t("download.step1"),
    t("download.step2"),
    t("download.step3"),
    t("download.step4"),
  ];

  return (
    <div className="container mx-auto py-10 px-4">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/"><HomeIcon className="size-4" /></Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("download.breadcrumb")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="text-center mb-12 animate-fade-up">
        <Badge emphasis="info" emphasisVariant="subtle" className="mb-4">
          Version {APP_VERSION}
        </Badge>
        <h1 className="text-4xl font-bold mb-4">
          {t("download.title")}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("download.subtitle")}
        </p>
      </div>

      {/* Download Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
        {/* Windows */}
        <Card className={platform === "windows" ? "border-primary" : ""}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info-muted rounded-lg">
                <MonitorIcon className="h-6 w-6 text-info" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Windows
                  {platform === "windows" && (
                    <Badge emphasis="positive" emphasisVariant="subtle" className="text-xs">{t("download.recommended")}</Badge>
                  )}
                </CardTitle>
                <CardDescription>{t("download.windowsDescription")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              size="lg"
              onClick={() => handleDownload("windows")}
              disabled={isLoading}
            >
              <DownloadIcon className="mr-2 h-4 w-4" />
              {t("download.downloadWindows")}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {t("download.installerExe")}
            </p>
          </CardContent>
        </Card>

        {/* macOS */}
        <Card className={platform === "mac" ? "border-primary" : ""}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <AppleIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  macOS
                  {platform === "mac" && (
                    <Badge emphasis="positive" emphasisVariant="subtle" className="text-xs">{t("download.recommended")}</Badge>
                  )}
                </CardTitle>
                <CardDescription>{t("download.macDescription")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              size="lg"
              variant={platform === "mac" ? "default" : "outline"}
              onClick={() => handleDownload("mac")}
              disabled={isLoading}
            >
              <DownloadIcon className="mr-2 h-4 w-4" />
              {t("download.downloadMac")}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {t("download.installerDmg")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Features — horizontal rows */}
      <div className="max-w-3xl mx-auto mb-12">
        <h2 className="text-2xl font-bold mb-6">{t("download.featuresTitle")}</h2>
        <div className="space-y-2">
          {features.map((feature, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-4 rounded-xl p-5 transition-colors hover:bg-muted/30",
                index === 0 && "animate-fade-up",
                index === 1 && "animate-fade-up-delay-1",
                index === 2 && "animate-fade-up-delay-2",
              )}
            >
              <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", feature.iconBg)}>
                <feature.icon className={cn("size-5", feature.iconColor)} />
              </div>
              <div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works — vertical timeline */}
      <div className="max-w-2xl mx-auto mb-12">
        <h2 className="text-2xl font-bold mb-8">{t("download.howItWorksTitle")}</h2>
        <div className="relative pl-12">
          {/* Vertical line */}
          <div className="absolute left-4 top-4 bottom-4 w-px bg-border" />

          <div className="space-y-6">
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              return (
                <div key={index} className="relative flex items-start gap-4">
                  {/* Circle on the line */}
                  <div
                    className={cn(
                      "absolute -left-8 flex size-9 shrink-0 items-center justify-center rounded-full border font-bold text-sm",
                      isLast
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted border-border"
                    )}
                  >
                    {index + 1}
                  </div>
                  <p className={cn(
                    "pt-1.5",
                    isLast ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {step}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Compliance */}
      <div className="max-w-2xl mx-auto">
        <Card className="bg-success-muted/30 border-success/20">
          <CardContent>
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircleIcon className="h-5 w-5 text-success" />
              <span className="font-semibold">{t("download.complianceTitle")}</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {t("download.complianceDescription")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
