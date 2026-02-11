"use client";

import { Progress } from "@/components/ui/progress";
import { SparklesIcon, BanIcon } from "lucide-react";
import { ChampionIcon } from "./ChampionComponents";
import type { DuoSynergy, BanRecommendation } from "./types";

export const DuoSynergySection = ({ synergy }: { synergy: DuoSynergy }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Compatibilite Roles</span>
          <span className="font-semibold">{synergy.roleCompatibility.toFixed(0)}%</span>
        </div>
        <Progress value={synergy.roleCompatibility} className="h-2" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Compatibilite Style</span>
          <span className="font-semibold">{synergy.playstyleCompatibility.toFixed(0)}%</span>
        </div>
        <Progress value={synergy.playstyleCompatibility} className="h-2" />
      </div>
    </div>
    {synergy.recommendations.length > 0 && (
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Recommandations</h4>
        <ul className="space-y-1">
          {synergy.recommendations.map((rec, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
              <SparklesIcon className="size-3 text-primary" />
              {rec}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

export const BanRecommendationsSection = ({
  bans,
  playerName,
}: {
  bans: BanRecommendation[];
  playerName: string;
}) => {
  if (bans.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-2">
        Aucun ban recommande
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <BanIcon className="size-4 text-loss" />
        Bans contre {playerName}
      </h4>
      <div className="flex gap-2">
        {bans.map((ban) => (
          <div key={ban.championId} className="flex flex-col items-center gap-1">
            <ChampionIcon championId={ban.championId} size={36} />
            <span className="text-xs text-muted-foreground text-center max-w-[60px] truncate">
              {ban.reason}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
