"use client";

import { Button } from "@/components/ui/button";
import {
  Loader2Icon,
  RefreshCwIcon,
  TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";

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
    </div>
  );
};

