"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChampionIcon } from "@/components/ChampionIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2Icon,
  SaveIcon,
  RotateCcwIcon,
  XIcon,
  SearchIcon,
  CheckIcon,
  ArrowRightLeftIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useChampions } from "@/lib/hooks/use-champions";
import { useI18n } from "@/lib/i18n-context";
import { authenticatedFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { ChampionEntity } from "@/types";
import { cn } from "@/lib/utils";

type RoleKey = "top" | "jungle" | "mid" | "adc" | "support";

const ROLES: { key: RoleKey; label: string; shortLabel: string }[] = [
  { key: "top", label: "Top", shortLabel: "TOP" },
  { key: "jungle", label: "Jungle", shortLabel: "JGL" },
  { key: "mid", label: "Mid", shortLabel: "MID" },
  { key: "adc", label: "ADC", shortLabel: "ADC" },
  { key: "support", label: "Support", shortLabel: "SUP" },
];

export default function CreateCompositionPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<RoleKey | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [compositionName, setCompositionName] = useState("");
  const [swapMode, setSwapMode] = useState<RoleKey | null>(null);

  const [composition, setComposition] = useState<Record<RoleKey, ChampionEntity | null>>({
    top: null,
    jungle: null,
    mid: null,
    adc: null,
    support: null,
  });

  const { champions, isLoading: championsLoading } = useChampions();

  // Filter champions based on search
  const filteredChampions = useMemo(() => {
    if (!champions.length) return [];
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return champions;
    return champions.filter((champion) =>
      champion.name.toLowerCase().includes(normalized)
    );
  }, [champions, searchTerm]);

  // Get list of already selected champion IDs
  const selectedChampionIds = useMemo(() => {
    return new Set(
      Object.values(composition)
        .filter((c): c is ChampionEntity => c !== null)
        .map((c) => c.id)
    );
  }, [composition]);

  // Count filled slots
  const filledCount = useMemo(() => {
    return Object.values(composition).filter((c) => c !== null).length;
  }, [composition]);

  // Handle clicking on a role slot
  const handleRoleClick = useCallback((role: RoleKey) => {
    if (swapMode) {
      // We're in swap mode - swap the two roles
      if (swapMode !== role) {
        setComposition((prev) => ({
          ...prev,
          [swapMode]: prev[role],
          [role]: prev[swapMode],
        }));
        toast.success(t("compositions.championsSwapped"));
      }
      setSwapMode(null);
    } else if (composition[role]) {
      // Role has a champion - enter swap mode
      setSwapMode(role);
      setSelectedRole(null);
    } else {
      // Empty role - select it for assignment
      setSelectedRole(role === selectedRole ? null : role);
      setSwapMode(null);
    }
  }, [composition, selectedRole, swapMode]);

  // Handle clicking on a champion
  const handleChampionClick = useCallback((champion: ChampionEntity) => {
    if (!selectedRole) {
      // No role selected - find first empty role
      const emptyRole = ROLES.find((r) => composition[r.key] === null);
      if (emptyRole) {
        setComposition((prev) => ({ ...prev, [emptyRole.key]: champion }));
        // Auto-select next empty role
        const nextEmpty = ROLES.find(
          (r) => r.key !== emptyRole.key && composition[r.key] === null
        );
        setSelectedRole(nextEmpty?.key || null);
      } else {
        toast.error(t("compositions.allRolesFilled"));
      }
    } else {
      // Assign to selected role
      setComposition((prev) => ({ ...prev, [selectedRole]: champion }));
      // Auto-select next empty role
      const nextEmpty = ROLES.find(
        (r) => r.key !== selectedRole && composition[r.key] === null
      );
      setSelectedRole(nextEmpty?.key || null);
    }
  }, [selectedRole, composition]);

  // Remove champion from role
  const handleRemoveChampion = useCallback((role: RoleKey, e: React.MouseEvent) => {
    e.stopPropagation();
    setComposition((prev) => ({ ...prev, [role]: null }));
    setSwapMode(null);
  }, []);

  // Reset composition
  const handleReset = useCallback(() => {
    setComposition({
      top: null,
      jungle: null,
      mid: null,
      adc: null,
      support: null,
    });
    setSelectedRole(null);
    setSwapMode(null);
    setSearchTerm("");
  }, []);

  // Save composition
  const handleSave = useCallback(async () => {
    if (!user) {
      toast.error(t("compositions.loginToSave"));
      return;
    }

    if (filledCount === 0) {
      toast.error(t("compositions.selectAtLeastOneChampion"));
      return;
    }

    if (!compositionName.trim()) {
      toast.error(t("compositions.giveCompositionName"));
      return;
    }

    setIsSaving(true);
    try {
      const response = await authenticatedFetch("/api/compositions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: compositionName.trim(),
          top: composition.top?.championId ?? null,
          jungle: composition.jungle?.championId ?? null,
          mid: composition.mid?.championId ?? null,
          adc: composition.adc?.championId ?? null,
          support: composition.support?.championId ?? null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || t("compositions.saveError"));
        return;
      }

      toast.success(t("compositions.compositionSavedSuccess"));
      setShowSaveDialog(false);
      router.push("/compositions/favorites");
    } catch {
      toast.error(t("compositions.saveError"));
    } finally {
      setIsSaving(false);
    }
  }, [user, filledCount, compositionName, composition, router, t]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("compositions.createTitle")}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {selectedRole
              ? t("compositions.selectChampionFor").replace("{role}", ROLES.find((r) => r.key === selectedRole)?.label ?? "")
              : swapMode
                ? t("compositions.clickToSwap")
                : t("compositions.clickRoleThenSelect")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={filledCount === 0}>
            <RotateCcwIcon className="size-4 sm:mr-1" />
            <span className="hidden sm:inline">{t("compositions.reset")}</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setShowSaveDialog(true)}
            disabled={filledCount === 0}
          >
            <SaveIcon className="size-4 sm:mr-1" />
            <span className="hidden sm:inline">{t("compositions.saveButton")}</span>
          </Button>
        </div>
      </div>

      {/* Role Slots */}
      <div className="grid grid-cols-5 gap-2 md:gap-4 mb-6">
        {ROLES.map((role) => {
          const champion = composition[role.key];
          const isSelected = selectedRole === role.key;
          const isSwapSource = swapMode === role.key;
          const isSwapTarget = swapMode && swapMode !== role.key;

          return (
            <div
              key={role.key}
              onClick={() => handleRoleClick(role.key)}
              className={cn(
                "relative flex flex-col items-center p-2 md:p-3 rounded-xl border-2 cursor-pointer transition-all",
                isSelected && "border-primary bg-primary/10 ring-2 ring-primary/30",
                isSwapSource && "border-yellow-500 bg-yellow-500/10 ring-2 ring-yellow-500/30",
                isSwapTarget && "border-dashed border-yellow-500/50 hover:border-yellow-500",
                !isSelected && !isSwapSource && !isSwapTarget && "border-border hover:border-primary/50",
                champion && !isSelected && !isSwapSource && "bg-muted/30"
              )}
            >
              {/* Role label */}
              <div className="text-[10px] md:text-xs font-medium text-muted-foreground mb-1 md:mb-2">
                {role.shortLabel}
              </div>

              {/* Champion or empty slot */}
              {champion ? (
                <div className="relative">
                  <ChampionIcon
                    championId={champion.championId}
                    size={48}
                    className="md:w-16 md:h-16 rounded-lg"
                  />
                  <button
                    onClick={(e) => handleRemoveChampion(role.key, e)}
                    className="absolute -top-1 -right-1 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors"
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>
              ) : (
                <div
                  className={cn(
                    "w-12 h-12 md:w-16 md:h-16 rounded-lg border-2 border-dashed flex items-center justify-center",
                    isSelected ? "border-primary" : "border-muted-foreground/30"
                  )}
                >
                  {isSelected && <CheckIcon className="size-5 text-primary" />}
                </div>
              )}

              {/* Champion name */}
              <div className="mt-1 md:mt-2 text-[10px] md:text-xs font-medium truncate max-w-full text-center">
                {champion?.name || "-"}
              </div>

              {/* Swap indicator */}
              {isSwapSource && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                  <Badge variant="outline" className="text-[8px] bg-yellow-500/20 border-yellow-500">
                    <ArrowRightLeftIcon className="size-2 mr-0.5" />
                    {t("compositions.swap")}
                  </Badge>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t("compositions.searchChampionPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <XIcon className="size-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Champion count */}
      <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
        <span>
          {filteredChampions.length} {filteredChampions.length > 1 ? "champions" : "champion"}
        </span>
        <span>
          {filledCount}/5 {t("compositions.selected")}
        </span>
      </div>

      {/* Champion Grid */}
      {championsLoading ? (
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
          {Array.from({ length: 24 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
          {filteredChampions.map((champion) => {
            const isSelected = selectedChampionIds.has(champion.id);

            return (
              <button
                key={champion.id}
                onClick={() => !isSelected && handleChampionClick(champion)}
                disabled={isSelected}
                className={cn(
                  "relative group rounded-lg overflow-hidden border transition-all",
                  isSelected
                    ? "opacity-40 cursor-not-allowed border-transparent"
                    : "hover:border-primary hover:scale-105 cursor-pointer border-transparent hover:shadow-lg"
                )}
                title={champion.name}
              >
                <ChampionIcon
                  championId={champion.championId}
                  size={64}
                  className="w-full aspect-square"
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <CheckIcon className="size-5 text-primary" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-[9px] text-white text-center truncate">
                    {champion.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* No results */}
      {!championsLoading && filteredChampions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {t("compositions.noChampionFound").replace("{search}", searchTerm)}
        </div>
      )}

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("compositions.saveCompositionDialog")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Preview */}
            <div className="flex justify-center gap-2">
              {ROLES.map((role) => {
                const champion = composition[role.key];
                return (
                  <div key={role.key} className="text-center">
                    {champion ? (
                      <ChampionIcon
                        championId={champion.championId}
                        size={40}
                        className="rounded-md"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-muted border-2 border-dashed" />
                    )}
                    <div className="text-[9px] text-muted-foreground mt-1">
                      {role.shortLabel}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Name input */}
            <Input
              placeholder={t("compositions.compositionNameLabel")}
              value={compositionName}
              onChange={(e) => setCompositionName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !compositionName.trim()}>
              {isSaving ? (
                <Loader2Icon className="size-4 animate-spin mr-2" />
              ) : (
                <SaveIcon className="size-4 mr-2" />
              )}
              {t("compositions.saveButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
