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
import { SummonerSpellIcon } from "@/components/SummonerSpellIcon";
import { useApiSWR, STATIC_DATA_CONFIG } from "@/lib/hooks/swr";
import { PlusIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummonerSpell {
  id: string;
  key: string;
  name: string;
  description: string;
  cooldown: number;
  image: string;
}

interface SummonerSpellsResponse {
  success: boolean;
  data: SummonerSpell[];
}

interface SummonerSpellSelectorProps {
  selectedSpells: string[];
  onSpellsChange: (spells: string[]) => void;
  label?: string;
  className?: string;
}

export const SummonerSpellSelector = ({
  selectedSpells,
  onSpellsChange,
  label,
  className,
}: SummonerSpellSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [selectingIndex, setSelectingIndex] = useState<0 | 1>(0);

  // Fetch summoner spells
  const { data: spellsData, isLoading } = useApiSWR<SummonerSpellsResponse>(
    "/api/summoner-spells",
    STATIC_DATA_CONFIG
  );

  const allSpells = spellsData?.data ?? [];

  // Get selected spell objects
  const selectedSpellObjects = useMemo(() => {
    return selectedSpells
      .map((spellId) => allSpells.find((s) => s.id === spellId))
      .filter(Boolean) as SummonerSpell[];
  }, [selectedSpells, allSpells]);

  const handleSelectSpell = (spellId: string) => {
    const newSpells = [...selectedSpells];
    newSpells[selectingIndex] = spellId;
    onSpellsChange(newSpells);
    setOpen(false);
  };

  const handleRemoveSpell = (index: number) => {
    const newSpells = selectedSpells.filter((_, i) => i !== index);
    onSpellsChange(newSpells);
  };

  const handleOpenDialog = (index: 0 | 1) => {
    setSelectingIndex(index);
    setOpen(true);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}

      <div className="flex gap-2">
        {/* Spell 1 */}
        {selectedSpellObjects[0] ? (
          <div className="relative group" title={selectedSpellObjects[0].name}>
            <button
              type="button"
              onClick={() => handleOpenDialog(0)}
              className="rounded-md overflow-hidden hover:ring-2 hover:ring-primary transition-all"
            >
              <SummonerSpellIcon
                spellImage={selectedSpellObjects[0].image}
                alt={selectedSpellObjects[0].name}
                size={44}
              />
            </button>
            <button
              type="button"
              onClick={() => handleRemoveSpell(0)}
              className="absolute -top-1 -right-1 size-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <XIcon className="size-3" />
            </button>
          </div>
        ) : (
          <Dialog
            open={open && selectingIndex === 0}
            onOpenChange={(o) => {
              if (o) handleOpenDialog(0);
              else setOpen(false);
            }}
          >
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="size-11 p-0"
                title="Ajouter un sort d'invocateur"
              >
                <PlusIcon className="size-5" />
              </Button>
            </DialogTrigger>
            <SpellDialogContent
              allSpells={allSpells}
              selectedSpells={selectedSpells}
              isLoading={isLoading}
              onSelect={handleSelectSpell}
              title="Sort d'invocateur 1"
            />
          </Dialog>
        )}

        {/* Spell 2 */}
        {selectedSpellObjects[1] ? (
          <div className="relative group" title={selectedSpellObjects[1].name}>
            <button
              type="button"
              onClick={() => handleOpenDialog(1)}
              className="rounded-md overflow-hidden hover:ring-2 hover:ring-primary transition-all"
            >
              <SummonerSpellIcon
                spellImage={selectedSpellObjects[1].image}
                alt={selectedSpellObjects[1].name}
                size={44}
              />
            </button>
            <button
              type="button"
              onClick={() => handleRemoveSpell(1)}
              className="absolute -top-1 -right-1 size-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <XIcon className="size-3" />
            </button>
          </div>
        ) : selectedSpells.length >= 1 ? (
          <Dialog
            open={open && selectingIndex === 1}
            onOpenChange={(o) => {
              if (o) handleOpenDialog(1);
              else setOpen(false);
            }}
          >
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="size-11 p-0"
                title="Ajouter un sort d'invocateur"
              >
                <PlusIcon className="size-5" />
              </Button>
            </DialogTrigger>
            <SpellDialogContent
              allSpells={allSpells}
              selectedSpells={selectedSpells}
              isLoading={isLoading}
              onSelect={handleSelectSpell}
              title="Sort d'invocateur 2"
            />
          </Dialog>
        ) : null}
      </div>
    </div>
  );
};

// Separate dialog content component
const SpellDialogContent = ({
  allSpells,
  selectedSpells,
  isLoading,
  onSelect,
  title,
}: {
  allSpells: SummonerSpell[];
  selectedSpells: string[];
  isLoading: boolean;
  onSelect: (spellId: string) => void;
  title: string;
}) => (
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
    </DialogHeader>

    {isLoading ? (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        Chargement...
      </div>
    ) : (
      <div className="grid grid-cols-4 gap-3">
        {allSpells.map((spell) => {
          const isSelected = selectedSpells.includes(spell.id);
          return (
            <button
              key={spell.id}
              type="button"
              onClick={() => onSelect(spell.id)}
              disabled={isSelected}
              className={cn(
                "relative p-2 rounded-lg transition-colors flex flex-col items-center gap-1",
                isSelected
                  ? "bg-muted opacity-50 cursor-not-allowed"
                  : "hover:bg-muted"
              )}
              title={`${spell.name} - ${spell.description}`}
            >
              <SummonerSpellIcon
                spellImage={spell.image}
                alt={spell.name}
                size={40}
              />
              <span className="text-xs truncate w-full text-center">
                {spell.name.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    )}
  </DialogContent>
);
