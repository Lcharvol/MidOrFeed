"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2Icon,
  RefreshCwIcon,
  TrendingUpIcon,
  LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n-context";

type SummonerActionsProps = {
  isUpdating: boolean;
  puuid?: string;
  region?: string;
  onUpdate: () => Promise<void>;
};

export const SummonerActions = ({
  isUpdating,
  puuid,
  region,
  onUpdate,
}: SummonerActionsProps) => {
  const { t } = useI18n();

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/summoners/${puuid}/overview${region ? `?region=${region}` : ""}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success(t("summoners.actions.linkCopied")),
      () => toast.error(t("summoners.actions.linkCopyFailed"))
    );
  }, [puuid, region, t]);

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={onUpdate}
        disabled={isUpdating || !puuid || !region}
        size="default"
      >
        {isUpdating ? (
          <>
            <Loader2Icon className="mr-2 size-4 animate-spin" />
            {t("summoners.actions.updating")}
          </>
        ) : (
          <>
            <RefreshCwIcon className="mr-2 size-4" />
            {t("summoners.actions.update")}
          </>
        )}
      </Button>
      <Button variant="outline" size="default" asChild disabled={!puuid}>
        <Link href="/tier-list/champions">
          <TrendingUpIcon className="mr-2 size-4" />
          {t("summoners.actions.tierChart")}
        </Link>
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleCopyLink}
        disabled={!puuid}
        aria-label={t("summoners.actions.copyProfileLink")}
        title={t("summoners.actions.copyLink")}
      >
        <LinkIcon className="size-4" />
      </Button>
    </div>
  );
};

