"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RuneIcon } from "@/components/RuneIcon";
import { useApiSWR, STATIC_DATA_CONFIG } from "@/lib/hooks/swr";
import { PlusIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RuneConfig } from "@/types/guides";

interface Rune {
  id: number;
  key: string;
  name: string;
  icon: string;
  description: string;
}

interface RuneTree {
  id: number;
  key: string;
  name: string;
  icon: string;
  keystones: Rune[];
  slots: Rune[][];
}

interface RunesResponse {
  success: boolean;
  data: RuneTree[];
}

interface RuneSelectorProps {
  value: RuneConfig | null;
  onChange: (config: RuneConfig | null) => void;
  label?: string;
  className?: string;
}

export const RuneSelector = ({
  value,
  onChange,
  label,
  className,
}: RuneSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState<"primary" | "secondary" | null>(null);

  // Fetch runes
  const { data: runesData, isLoading } = useApiSWR<RunesResponse>(
    "/api/runes",
    STATIC_DATA_CONFIG
  );

  const allTrees = runesData?.data ?? [];

  // Get currently selected trees
  const primaryTree = useMemo(
    () => allTrees.find((t) => t.key === value?.primary?.tree),
    [allTrees, value?.primary?.tree]
  );

  const secondaryTree = useMemo(
    () => allTrees.find((t) => t.key === value?.secondary?.tree),
    [allTrees, value?.secondary?.tree]
  );

  // Find runes by key
  const findRune = (tree: RuneTree | undefined, key: string) => {
    if (!tree) return null;
    const keystone = tree.keystones.find((r) => r.key === key);
    if (keystone) return keystone;
    for (const slot of tree.slots) {
      const rune = slot.find((r) => r.key === key);
      if (rune) return rune;
    }
    return null;
  };

  const handleSelectPrimaryTree = (treeKey: string) => {
    const tree = allTrees.find((t) => t.key === treeKey);
    if (!tree) return;

    onChange({
      primary: {
        tree: treeKey,
        keystone: "",
        slots: [],
      },
      secondary: value?.secondary ?? { tree: "", slots: [] },
      shards: value?.shards ?? ["", "", ""],
    });
  };

  const handleSelectKeystone = (keystoneKey: string) => {
    if (!value?.primary?.tree) return;
    onChange({
      ...value,
      primary: {
        ...value.primary,
        keystone: keystoneKey,
      },
    });
  };

  const handleSelectPrimaryRune = (slotIndex: number, runeKey: string) => {
    if (!value?.primary) return;
    const newSlots = [...(value.primary.slots || [])];
    newSlots[slotIndex] = runeKey;
    onChange({
      ...value,
      primary: {
        ...value.primary,
        slots: newSlots,
      },
    });
  };

  const handleSelectSecondaryTree = (treeKey: string) => {
    onChange({
      ...value!,
      secondary: {
        tree: treeKey,
        slots: [],
      },
    });
  };

  const handleSelectSecondaryRune = (runeKey: string) => {
    if (!value?.secondary?.tree) return;
    const currentSlots = value.secondary.slots || [];

    // Toggle selection (max 2 runes, different slots)
    if (currentSlots.includes(runeKey)) {
      onChange({
        ...value,
        secondary: {
          ...value.secondary,
          slots: currentSlots.filter((k) => k !== runeKey),
        },
      });
    } else if (currentSlots.length < 2) {
      onChange({
        ...value,
        secondary: {
          ...value.secondary,
          slots: [...currentSlots, runeKey],
        },
      });
    }
  };

  const handleClear = () => {
    onChange(null);
    setOpen(false);
  };

  const hasConfig = value?.primary?.tree && value?.primary?.keystone;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {hasConfig ? (
            <Button
              type="button"
              variant="outline"
              className="h-auto p-3 justify-start gap-3 w-full"
            >
              <div className="flex items-center gap-2">
                {primaryTree && (
                  <RuneIcon runeIcon={primaryTree.icon} size={32} />
                )}
                {value?.primary?.keystone && primaryTree && (
                  <RuneIcon
                    runeIcon={findRune(primaryTree, value.primary.keystone)?.icon}
                    size={40}
                  />
                )}
                {secondaryTree && (
                  <RuneIcon runeIcon={secondaryTree.icon} size={24} />
                )}
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">
                  {primaryTree?.name} / {secondaryTree?.name || "..."}
                </div>
                <div className="text-xs text-muted-foreground">
                  {findRune(primaryTree, value?.primary?.keystone || "")?.name}
                </div>
              </div>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-11 gap-2"
            >
              <PlusIcon className="size-4" />
              Configurer les runes
            </Button>
          )}
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuration des runes</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              Chargement...
            </div>
          ) : (
            <Tabs defaultValue="primary" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="primary">Arbre principal</TabsTrigger>
                <TabsTrigger value="secondary">Arbre secondaire</TabsTrigger>
              </TabsList>

              <TabsContent value="primary" className="space-y-4">
                {/* Tree selection */}
                <div className="flex justify-center gap-2">
                  {allTrees.map((tree) => (
                    <button
                      key={tree.key}
                      type="button"
                      onClick={() => handleSelectPrimaryTree(tree.key)}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        value?.primary?.tree === tree.key
                          ? "bg-primary/20 ring-2 ring-primary"
                          : "hover:bg-muted"
                      )}
                      title={tree.name}
                    >
                      <RuneIcon runeIcon={tree.icon} size={48} />
                    </button>
                  ))}
                </div>

                {primaryTree && (
                  <>
                    {/* Keystone selection */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-center">
                        Keystone
                      </div>
                      <div className="flex justify-center gap-3">
                        {primaryTree.keystones.map((keystone) => (
                          <button
                            key={keystone.key}
                            type="button"
                            onClick={() => handleSelectKeystone(keystone.key)}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              value?.primary?.keystone === keystone.key
                                ? "bg-primary/20 ring-2 ring-primary"
                                : "hover:bg-muted"
                            )}
                            title={keystone.name}
                          >
                            <RuneIcon runeIcon={keystone.icon} size={56} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Minor runes */}
                    {primaryTree.slots.map((slot, slotIndex) => (
                      <div key={slotIndex} className="space-y-2">
                        <div className="flex justify-center gap-3">
                          {slot.map((rune) => (
                            <button
                              key={rune.key}
                              type="button"
                              onClick={() =>
                                handleSelectPrimaryRune(slotIndex, rune.key)
                              }
                              className={cn(
                                "p-2 rounded-lg transition-all",
                                value?.primary?.slots?.[slotIndex] === rune.key
                                  ? "bg-primary/20 ring-2 ring-primary"
                                  : "hover:bg-muted"
                              )}
                              title={rune.name}
                            >
                              <RuneIcon runeIcon={rune.icon} size={40} />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </TabsContent>

              <TabsContent value="secondary" className="space-y-4">
                {/* Secondary tree selection (exclude primary) */}
                <div className="flex justify-center gap-2">
                  {allTrees
                    .filter((t) => t.key !== value?.primary?.tree)
                    .map((tree) => (
                      <button
                        key={tree.key}
                        type="button"
                        onClick={() => handleSelectSecondaryTree(tree.key)}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          value?.secondary?.tree === tree.key
                            ? "bg-primary/20 ring-2 ring-primary"
                            : "hover:bg-muted"
                        )}
                        title={tree.name}
                      >
                        <RuneIcon runeIcon={tree.icon} size={48} />
                      </button>
                    ))}
                </div>

                {secondaryTree && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-center text-muted-foreground">
                      Sélectionnez 2 runes de slots différents
                    </div>
                    {secondaryTree.slots.map((slot, slotIndex) => (
                      <div key={slotIndex} className="flex justify-center gap-3">
                        {slot.map((rune) => {
                          const isSelected =
                            value?.secondary?.slots?.includes(rune.key);
                          const currentCount =
                            value?.secondary?.slots?.length || 0;
                          const canSelect = isSelected || currentCount < 2;

                          return (
                            <button
                              key={rune.key}
                              type="button"
                              onClick={() => handleSelectSecondaryRune(rune.key)}
                              disabled={!canSelect}
                              className={cn(
                                "p-2 rounded-lg transition-all",
                                isSelected
                                  ? "bg-primary/20 ring-2 ring-primary"
                                  : canSelect
                                  ? "hover:bg-muted"
                                  : "opacity-30 cursor-not-allowed"
                              )}
                              title={rune.name}
                            >
                              <RuneIcon runeIcon={rune.icon} size={40} />
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {hasConfig && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-destructive"
              >
                <XIcon className="size-4 mr-1" />
                Effacer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
