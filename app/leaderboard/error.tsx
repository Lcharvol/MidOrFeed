"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";

export default function LeaderboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error("Leaderboard error:", error);
  }, [error]);

  return (
    <div className="container mx-auto py-20 px-4">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">{t("errors.leaderboardTitle")}</CardTitle>
          <CardDescription>
            {t("errors.leaderboardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button onClick={reset} variant="default" className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("errors.retry")}
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              {t("errors.home")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
