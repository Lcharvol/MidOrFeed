"use client";

import { useState, useEffect } from "react";
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
  EyeIcon
} from "lucide-react";

type Platform = "windows" | "mac" | "unknown";

const GITHUB_REPO = "Lcharvol/lol-comp-maker";
const APP_VERSION = "1.0.0";

export default function DownloadPage() {
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleSilicon, setIsAppleSilicon] = useState(false);

  useEffect(() => {
    // Detect user's platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("win")) {
      setPlatform("windows");
    } else if (userAgent.includes("mac")) {
      setPlatform("mac");
      // Try to detect Apple Silicon
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

  const handleDownload = (targetPlatform: Platform) => {
    setIsLoading(true);
    window.location.href = getDownloadUrl(targetPlatform);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const features = [
    {
      icon: ZapIcon,
      title: "Champion Select Helper",
      description: "Suggestions de picks en temps reel pendant la selection des champions"
    },
    {
      icon: EyeIcon,
      title: "Overlay Transparent",
      description: "S'affiche par-dessus le jeu sans bloquer votre vue"
    },
    {
      icon: ShieldIcon,
      title: "100% Safe",
      description: "Utilise uniquement l'API officielle de Riot Games, aucun risque de ban"
    }
  ];

  return (
    <div className="container mx-auto py-10 px-4">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">
          Version {APP_VERSION}
        </Badge>
        <h1 className="text-4xl font-bold mb-4">
          MidOrFeed Overlay
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Application desktop pour afficher des informations en temps reel pendant vos parties de League of Legends.
        </p>
      </div>

      {/* Download Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
        {/* Windows */}
        <Card className={platform === "windows" ? "border-primary" : ""}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MonitorIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Windows
                  {platform === "windows" && (
                    <Badge variant="outline" className="text-xs">Recommande</Badge>
                  )}
                </CardTitle>
                <CardDescription>Windows 10/11 (64-bit)</CardDescription>
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
              Telecharger pour Windows
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              .exe - Installateur NSIS
            </p>
          </CardContent>
        </Card>

        {/* macOS */}
        <Card className={platform === "mac" ? "border-primary" : ""}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-500/10 rounded-lg">
                <AppleIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  macOS
                  {platform === "mac" && (
                    <Badge variant="outline" className="text-xs">Recommande</Badge>
                  )}
                </CardTitle>
                <CardDescription>macOS 10.15+ (Intel & Apple Silicon)</CardDescription>
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
              Telecharger pour Mac
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              .dmg - Image disque
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Fonctionnalites</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="inline-flex p-3 bg-primary/10 rounded-full mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-2xl mx-auto mt-12">
        <h2 className="text-2xl font-bold text-center mb-8">Comment ca marche ?</h2>
        <div className="space-y-4">
          {[
            "Telechargez et installez l'application",
            "Lancez MidOrFeed Overlay",
            "Lancez League of Legends",
            "L'overlay detecte automatiquement le client et s'affiche pendant le Champion Select"
          ].map((step, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <p className="text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ / Notes */}
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircleIcon className="h-5 w-5 text-success" />
              <span className="font-semibold">Conforme aux conditions d'utilisation de Riot Games</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Cette application utilise uniquement l'API officielle League Client Update (LCU)
              et ne modifie en aucun cas les fichiers du jeu.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
