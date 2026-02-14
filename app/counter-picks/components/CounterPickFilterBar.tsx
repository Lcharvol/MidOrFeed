"use client";

import { ChampionSelect } from "@/components/ChampionSelect";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { UserIcon, GlobeIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import type { CounterPickMode } from "@/types";

type ChampionOption = {
  id: string;
  name: string;
};

type CounterPickFilterBarProps = {
  championOptions: ChampionOption[];
  selectedChampion: string;
  onChampionChange: (championId: string) => void;
  mode: CounterPickMode;
  onModeChange: (mode: CounterPickMode) => void;
};

export const CounterPickFilterBar = ({
  championOptions,
  selectedChampion,
  onChampionChange,
  mode,
  onModeChange,
}: CounterPickFilterBarProps) => {
  const { t } = useI18n();

  return (
    <div className="rounded-lg border bg-muted/30 p-3 sm:p-4">
    <div className="flex flex-wrap items-end gap-2 sm:gap-3">
      {/* Champion select */}
      <div className="flex flex-col gap-1 w-full sm:w-56">
        <label className="text-[10px] font-medium text-muted-foreground">
          {t("counterPicks.champion")}
        </label>
        <ChampionSelect
          options={championOptions}
          value={selectedChampion || null}
          onChange={onChampionChange}
          placeholder={t("counterPicks.searchPlaceholder")}
        />
      </div>

      {/* Mode toggle */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-muted-foreground">
          {t("counterPicks.matchupType")}
        </label>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={mode}
          onValueChange={(value) => {
            if (value) onModeChange(value as CounterPickMode);
          }}
          className="h-7 sm:h-8"
        >
          <ToggleGroupItem value="same_lane" className="px-2 sm:px-3 gap-1">
            <UserIcon className="size-3.5" />
            <span className="text-[10px] sm:text-xs">{t("counterPicks.sameLane")}</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="global" className="px-2 sm:px-3 gap-1">
            <GlobeIcon className="size-3.5" />
            <span className="text-[10px] sm:text-xs">{t("counterPicks.global")}</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
    </div>
  );
};
