"use client";

import { ArrowRightIcon } from "lucide-react";

type RiotConnectionBannerProps = {
  hasConnectedAccount: boolean;
};

export const RiotConnectionBanner = ({
  hasConnectedAccount,
}: RiotConnectionBannerProps) => {
  if (hasConnectedAccount) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3">
      <div className="flex size-8 items-center justify-center rounded bg-orange-500/20">
        <span className="text-lg">⚔️</span>
      </div>
      <p className="flex-1 text-sm">
        Connecte ton compte Riot et configure ton profil.
      </p>
      <ArrowRightIcon className="size-4 text-muted-foreground" />
    </div>
  );
};

