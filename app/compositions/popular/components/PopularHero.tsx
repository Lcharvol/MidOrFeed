"use client";

import { Button } from "@/components/ui/button";
import { RefreshCwIcon, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";

type PopularHeroProps = {
  onRefresh: () => void;
  isRefreshing: boolean;
  lastGeneratedAt?: string;
};

export const PopularHero = ({
  onRefresh,
  isRefreshing,
  lastGeneratedAt,
}: PopularHeroProps) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-2">
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm",
            "bg-muted text-muted-foreground"
          )}
        >
          <RefreshCwIcon className="size-4 animate-spin-slow" />
          {t("compositions.popular.aiSuggestions")}
        </div>
        <h1 className="text-4xl font-bold">{t("compositions.popular.heroTitle")}</h1>
        <p className="max-w-2xl text-muted-foreground">
          {t("compositions.popular.heroDescription")}
        </p>
        {lastGeneratedAt && (
          <p className="text-sm text-muted-foreground/80">
            {t("compositions.popular.lastGeneration").replace("{date}", lastGeneratedAt)}
          </p>
        )}
      </div>
      <Button
        variant="outline"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="gap-2"
      >
        {isRefreshing ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            {t("compositions.popular.refreshing")}
          </>
        ) : (
          <>
            <RefreshCwIcon className="size-4" />
            {t("compositions.popular.refresh")}
          </>
        )}
      </Button>
    </div>
  );
};
