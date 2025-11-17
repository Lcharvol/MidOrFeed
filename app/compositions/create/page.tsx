"use client";

import { useMemo, useState } from "react";
import { ChampionIcon } from "@/components/ChampionIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { useChampions } from "@/lib/hooks/use-champions";
import { useI18n } from "@/lib/i18n-context";
import type { ChampionEntity } from "@/types";

const ROLES = [
  { value: "top", label: "Top Lane", icon: "⚔️" },
  { value: "jungle", label: "Jungle", icon: "🌲" },
  { value: "mid", label: "Mid Lane", icon: "🔮" },
  { value: "adc", label: "ADC / Bot Carry", icon: "🏹" },
  { value: "support", label: "Support", icon: "🛡️" },
];

export default function CreateCompositionPage() {
  const { t } = useI18n();
  const [compositionName, setCompositionName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChampions, setSelectedChampions] = useState<
    Record<string, ChampionEntity | null>
  >({
    top: null,
    jungle: null,
    mid: null,
    adc: null,
    support: null,
  });

  const {
    champions,
    isLoading: championsLoading,
    error: championsError,
  } = useChampions();

  const filteredChampions = useMemo(() => {
    if (!champions.length) return [];
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return champions;
    return champions.filter((champion) =>
      champion.name.toLowerCase().includes(normalized)
    );
  }, [champions, searchTerm]);

  const handleChampionSelect = (role: string, champion: ChampionEntity) => {
    setSelectedChampions((prev) => ({
      ...prev,
      [role]: champion,
    }));
    const roleLabel = ROLES.find((r) => r.value === role)?.label || role;
    toast.success(
      t("compositions.addedToRole")
        .replace("{championName}", champion.name)
        .replace("{role}", roleLabel)
    );
  };

  const handleChampionRemove = (role: string) => {
    setSelectedChampions((prev) => ({
      ...prev,
      [role]: null,
    }));
  };

  const handleSave = () => {
    const selectedCount = Object.values(selectedChampions).filter(
      (champ) => champ !== null
    ).length;

    if (selectedCount === 0) {
      toast.error(t("compositions.atLeastOneChampion"));
      return;
    }

    if (!compositionName.trim()) {
      toast.error(t("compositions.compositionNameRequired"));
      return;
    }

    // TODO: Sauvegarder la composition
    toast.success(t("compositions.compositionSaved"));
    console.log("Composition:", { compositionName, selectedChampions });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">{t("compositions.createTitle")}</h1>
        <p className="text-muted-foreground">
          {t("compositions.buildYourTeam")}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Colonne gauche - Sélection des champions */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Nom de la composition */}
            <Card>
              <CardHeader>
                <CardTitle>{t("compositions.compositionName")}</CardTitle>
                <CardDescription>
                  {t("compositions.giveNameToComposition")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder={t("compositions.compositionNamePlaceholder")}
                  value={compositionName}
                  onChange={(e) => setCompositionName(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Rôles et champions sélectionnés */}
            <Card>
              <CardHeader>
                <CardTitle>{t("compositions.team")}</CardTitle>
                <CardDescription>
                  {t("compositions.selectChampionsForEachPosition")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ROLES.map((role) => (
                    <div key={role.value} className="space-y-2">
                      <Label className="flex items-center gap-2 text-base">
                        <span>{role.icon}</span>
                        {role.label}
                      </Label>
                      {selectedChampions[role.value] ? (
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <ChampionIcon
                              championId={
                                selectedChampions[role.value]!.championId
                              }
                              alt={selectedChampions[role.value]!.name}
                              size={48}
                              shape="rounded"
                            />
                            <div>
                              <div className="font-medium">
                                {selectedChampions[role.value]!.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {selectedChampions[role.value]!.title}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleChampionRemove(role.value)}
                          >
                            <XIcon className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex h-16 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                          {t("compositions.noChampionSelected")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Liste des champions disponibles */}
            <Card>
              <CardHeader>
                <CardTitle>{t("compositions.availableChampions")}</CardTitle>
                <CardDescription>
                  {t("compositions.searchAndSelectChampion")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    placeholder={t("compositions.searchChampionPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />

                  {championsLoading && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2Icon className="size-8 animate-spin text-primary" />
                    </div>
                  )}

                  {championsError ? (
                    <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
                      <p className="text-destructive">
                        {t("compositions.errorLoadingChampions")}
                      </p>
                    </div>
                  ) : null}

                  {!championsLoading && !championsError && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {filteredChampions.map((champion) => {
                        const isSelected = Object.values(
                          selectedChampions
                        ).some((champ) => champ?.id === champion.id);

                        return (
                          <div
                            key={champion.id}
                            className={`group relative cursor-pointer rounded-lg border transition-all hover:border-primary/50 ${
                              isSelected
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:shadow-md"
                            }`}
                          >
                            <ChampionIcon
                              championId={champion.championId}
                              alt={champion.name}
                              size={64}
                              shape="rounded"
                            />
                            <div className="p-2">
                              <div className="text-center text-sm font-medium">
                                {champion.name}
                              </div>
                            </div>

                            {!isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                                <div className="grid grid-cols-5 gap-1 rounded-lg bg-background/95 p-2 shadow-lg">
                                  {ROLES.map((role) => (
                                    <button
                                      key={role.value}
                                      onClick={() =>
                                        handleChampionSelect(
                                          role.value,
                                          champion
                                        )
                                      }
                                      className="flex size-10 items-center justify-center rounded border transition-colors hover:bg-primary hover:text-primary-foreground"
                                      title={t("compositions.addToRole").replace(
                                        "{role}",
                                        role.label
                                      )}
                                    >
                                      <span className="text-xs">
                                        {role.icon}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Colonne droite - Aperçu et actions */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>{t("compositions.preview")}</CardTitle>
              <CardDescription>{t("compositions.previewDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Résumé des champions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("summoners.champions")}</span>
                    <Badge variant="secondary">
                      {
                        Object.values(selectedChampions).filter(
                          (champ) => champ !== null
                        ).length
                      }
                      /5
                    </Badge>
                  </div>

                  {Object.entries(selectedChampions).map(([role, champion]) => {
                    if (!champion) return null;
                    const roleInfo = ROLES.find((r) => r.value === role);
                    return (
                      <div
                        key={role}
                        className="flex items-center gap-2 rounded-lg border p-2"
                      >
                        <span className="text-xs">{roleInfo?.icon}</span>
                        <span className="flex-1 text-sm">{champion.name}</span>
                      </div>
                    );
                  })}

                  {Object.values(selectedChampions).every(
                    (champ) => champ === null
                  ) && (
                    <p className="text-center text-sm text-muted-foreground">
                      {t("compositions.noChampionSelected")}
                    </p>
                  )}
                </div>

                {/* Boutons d'action */}
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSave}
                    disabled={championsLoading}
                  >
                    <PlusIcon className="mr-2 size-5" />
                    {t("compositions.save")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedChampions({
                        top: null,
                        jungle: null,
                        mid: null,
                        adc: null,
                        support: null,
                      });
                      setCompositionName("");
                      toast.success(t("compositions.resetComposition"));
                    }}
                  >
                    {t("compositions.reset")}
                  </Button>
                </div>

                {/* Stats moyennes */}
                {Object.values(selectedChampions).some(
                  (champ) => champ !== null
                ) && (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="mb-3 text-sm font-medium">
                      {t("compositions.averageStats")}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t("compositions.attack")}
                        </span>
                        <span className="font-medium">
                          {Math.round(
                            Object.values(selectedChampions)
                              .filter((champ) => champ !== null)
                              .reduce((sum, champ) => sum + champ!.attack, 0) /
                              Object.values(selectedChampions).filter(
                                (champ) => champ !== null
                              ).length
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t("compositions.defense")}
                        </span>
                        <span className="font-medium">
                          {Math.round(
                            Object.values(selectedChampions)
                              .filter((champ) => champ !== null)
                              .reduce((sum, champ) => sum + champ!.defense, 0) /
                              Object.values(selectedChampions).filter(
                                (champ) => champ !== null
                              ).length
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {t("compositions.magic")}
                        </span>
                        <span className="font-medium">
                          {Math.round(
                            Object.values(selectedChampions)
                              .filter((champ) => champ !== null)
                              .reduce((sum, champ) => sum + champ!.magic, 0) /
                              Object.values(selectedChampions).filter(
                                (champ) => champ !== null
                              ).length
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
