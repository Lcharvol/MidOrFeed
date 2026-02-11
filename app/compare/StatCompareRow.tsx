"use client";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const STAT_DESCRIPTIONS: Record<string, string> = {
  "Win Rate": "Pourcentage de victoires sur toutes les parties analysees",
  KDA: "Ratio (Kills + Assists) / Deaths moyen",
  Kills: "Nombre moyen d'eliminations par partie",
  Deaths: "Nombre moyen de morts par partie (moins = mieux)",
  Assists: "Nombre moyen d'assistances par partie",
  Degats: "Degats infliges aux champions en moyenne",
  "Degats subis": "Degats subis en moyenne (moins = mieux)",
  "Gold/min": "Or gagne par minute en moyenne",
  "Degats/min": "Degats infliges par minute en moyenne",
  Vision: "Score de vision moyen par partie",
  "Gold moyen": "Or total gagne en moyenne par partie",
  "Duree moy.": "Duree moyenne des parties",
  Parties: "Nombre total de parties analysees",
  "Forme recente": "Win rate sur les 10 dernieres parties",
};

export const StatCompareRow = ({
  label,
  value1,
  value2,
  icon,
  higherIsBetter = true,
  format = (v: number) => v.toFixed(1),
}: {
  label: string;
  value1: number;
  value2: number;
  icon: React.ReactNode;
  higherIsBetter?: boolean;
  format?: (v: number) => string;
}) => {
  const winner =
    value1 === value2
      ? null
      : higherIsBetter
        ? value1 > value2
          ? 1
          : 2
        : value1 < value2
          ? 1
          : 2;

  const description = STAT_DESCRIPTIONS[label];

  return (
    <div className="flex items-center gap-2 sm:gap-4 py-2 sm:py-3 border-b border-border/50 last:border-0">
      <div
        className={`flex-1 text-right font-semibold text-sm sm:text-lg ${winner === 1 ? "text-win" : "text-foreground"}`}
      >
        {format(value1)}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground text-[10px] sm:text-sm w-20 sm:w-36 justify-center shrink-0 cursor-default">
            {icon}
            <span className="truncate">{label}</span>
          </div>
        </TooltipTrigger>
        {description && (
          <TooltipContent sideOffset={4} className="max-w-xs">
            {description}
          </TooltipContent>
        )}
      </Tooltip>
      <div
        className={`flex-1 text-left font-semibold text-sm sm:text-lg ${winner === 2 ? "text-win" : "text-foreground"}`}
      >
        {format(value2)}
      </div>
    </div>
  );
};
