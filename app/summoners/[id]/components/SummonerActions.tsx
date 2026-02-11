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
  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/summoners/${puuid}/overview${region ? `?region=${region}` : ""}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Lien copié !"),
      () => toast.error("Impossible de copier le lien")
    );
  }, [puuid, region]);

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
            Mise à jour...
          </>
        ) : (
          <>
            <RefreshCwIcon className="mr-2 size-4" />
            Mettre à jour
          </>
        )}
      </Button>
      <Button variant="outline" size="default" asChild disabled={!puuid}>
        <Link href="/tier-list/champions">
          <TrendingUpIcon className="mr-2 size-4" />
          Graphique de tier
        </Link>
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleCopyLink}
        disabled={!puuid}
        aria-label="Copier le lien du profil"
        title="Copier le lien"
      >
        <LinkIcon className="size-4" />
      </Button>
    </div>
  );
};

