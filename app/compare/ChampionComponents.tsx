"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DDRAGON_VERSION } from "@/constants/ddragon";
import { ROLE_LABELS } from "./types";
import type { ChampionStat, RoleDistribution, CommonChampion } from "./types";

export const ChampionIcon = ({ championId, size = 32 }: { championId: string; size?: number }) => (
  <img
    src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${championId}.png`}
    alt={championId}
    className="rounded"
    style={{ width: size, height: size }}
  />
);

export const TopChampionsSection = ({
  champions,
  title,
}: {
  champions: ChampionStat[];
  title: string;
}) => (
  <div className="space-y-2">
    <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
    <div className="space-y-2">
      {champions.slice(0, 5).map((champ) => (
        <div key={champ.championId} className="flex items-center gap-2 text-sm">
          <ChampionIcon championId={champ.championId} size={28} />
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium">{champ.championId}</div>
            <div className="text-xs text-muted-foreground">
              {champ.games} parties - {champ.kda.toFixed(2)} KDA
            </div>
          </div>
          <Badge variant={champ.winRate >= 50 ? "default" : "secondary"} className="text-xs">
            {champ.winRate.toFixed(0)}%
          </Badge>
        </div>
      ))}
    </div>
  </div>
);

export const RoleDistributionSection = ({ roles }: { roles: RoleDistribution[] }) => (
  <div className="space-y-2">
    {roles.slice(0, 4).map((role) => (
      <div key={role.role} className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>{ROLE_LABELS[role.role] || role.role}</span>
          <span className="text-muted-foreground">{role.percentage.toFixed(0)}%</span>
        </div>
        <Progress value={role.percentage} className="h-1.5" />
      </div>
    ))}
  </div>
);

export const CommonChampionsSection = ({ champions }: { champions: CommonChampion[] }) => {
  if (champions.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        Aucun champion en commun avec suffisamment de parties
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {champions.slice(0, 5).map((champ) => (
        <div key={champ.championId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
          <ChampionIcon championId={champ.championId} size={40} />
          <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className={champ.player1.winRate >= champ.player2.winRate ? "text-win font-semibold" : ""}>
                {champ.player1.winRate.toFixed(0)}% WR
              </div>
              <div className="text-xs text-muted-foreground">
                {champ.player1.kda.toFixed(2)} KDA ({champ.player1.games} games)
              </div>
            </div>
            <div className="text-center">
              <div className={champ.player2.winRate > champ.player1.winRate ? "text-win font-semibold" : ""}>
                {champ.player2.winRate.toFixed(0)}% WR
              </div>
              <div className="text-xs text-muted-foreground">
                {champ.player2.kda.toFixed(2)} KDA ({champ.player2.games} games)
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
