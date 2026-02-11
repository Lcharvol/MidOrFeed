"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Loader2Icon,
  ChevronDownIcon,
  RefreshCwIcon,
  CheckIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useGameVersionContext } from "@/components/GameVersionProvider";

export function HeaderVersionSelector({
  isVersionOpen,
  setIsVersionOpen,
}: {
  isVersionOpen: boolean;
  setIsVersionOpen: (open: boolean) => void;
}) {
  const {
    versions,
    currentVersion,
    selectedVersion,
    isLoading: versionsLoading,
    isValidating: versionsValidating,
    selectVersion,
    clearSelection,
    refresh: refreshVersions,
  } = useGameVersionContext();
  const versionLabel = selectedVersion ?? currentVersion ?? "Inconnue";
  const isCustomVersion =
    selectedVersion !== null && selectedVersion !== currentVersion;

  const handleSelectVersion = useCallback(
    async (version: string) => {
      if (version === selectedVersion) {
        setIsVersionOpen(false);
        return;
      }

      selectVersion(version);
      toast.success(`Version ${version} sélectionnée.`);
      setIsVersionOpen(false);
    },
    [selectedVersion, selectVersion, setIsVersionOpen]
  );

  return (
    <Popover open={isVersionOpen} onOpenChange={setIsVersionOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors",
            "hover:border-primary/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            (versionsLoading || versionsValidating) && "cursor-progress"
          )}
        >
          {versionsLoading || versionsValidating ? (
            <>
              <Loader2Icon className="size-3.5 animate-spin" />
              <span>Patch</span>
            </>
          ) : (
            <>
              <span className="uppercase text-[11px] tracking-wide text-muted-foreground">
                Patch
              </span>
              <span className="text-xs font-semibold text-foreground">
                {versionLabel}
              </span>
              <ChevronDownIcon className="size-3 text-muted-foreground" />
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[220px] rounded-xl border border-border/60 bg-background/95 p-3 shadow-lg backdrop-blur"
        align="end"
        sideOffset={12}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase text-muted-foreground">
            Versions du jeu
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            onClick={() => {
              void refreshVersions();
            }}
          >
            <RefreshCwIcon className="size-3.5" />
            <span className="sr-only">Rafraîchir les versions</span>
          </Button>
        </div>

        <div className="max-h-60 space-y-1 overflow-y-auto">
          {versionsLoading && (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
              <Loader2Icon className="size-3.5 animate-spin" />
              Chargement...
            </div>
          )}
          {!versionsLoading && versions.length === 0 && (
            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Aucune version trouvée. Lancez une synchronisation depuis
              l'espace admin.
            </div>
          )}
          {!versionsLoading &&
            versions.map((entry) => {
              const isActive = entry.version === selectedVersion;
              const isGlobal = entry.version === currentVersion;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => handleSelectVersion(entry.version)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs transition-colors",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "hover:bg-muted/70"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">
                      {entry.version}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isGlobal && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                        Officiel
                      </span>
                    )}
                    {isActive ? (
                      <CheckIcon className="size-3.5 text-primary" />
                    ) : (
                      <span className="text-[10px] uppercase text-muted-foreground">
                        Utiliser
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
        </div>

        <div className="mt-3 rounded-md bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
          Patch officiel : {currentVersion ?? "inconnu"}. Sélectionnez un
          autre patch pour prévisualiser les données avec cette version
          (stocké sur cet appareil).
        </div>

        {isCustomVersion && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full text-xs"
            onClick={() => {
              clearSelection();
              toast.success("Patch officiel rétabli.");
              setIsVersionOpen(false);
            }}
          >
            Revenir au patch officiel ({currentVersion ?? "inconnu"})
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
