"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChampionIcon } from "@/components/ChampionIcon";
import { useApiSWR, STATIC_DATA_CONFIG } from "@/lib/hooks/swr";
import { SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Champion {
  id: string;
  championId: string;
  name: string;
  title: string;
}

interface ChampionsResponse {
  success: boolean;
  data: Champion[];
}

interface ChampionSelectorProps {
  value: string | null;
  onChange: (championId: string) => void;
  className?: string;
}

export const ChampionSelector = ({
  value,
  onChange,
  className,
}: ChampionSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Fetch all champions
  const { data: championsData, isLoading } = useApiSWR<ChampionsResponse>(
    "/api/champions/list?limit=200",
    STATIC_DATA_CONFIG
  );

  const allChampions = championsData?.data ?? [];

  // Filter champions by search
  const filteredChampions = useMemo(() => {
    if (!search.trim()) return allChampions;
    const searchLower = search.toLowerCase();
    return allChampions.filter(
      (champion) =>
        champion.name.toLowerCase().includes(searchLower) ||
        champion.championId.toLowerCase().includes(searchLower)
    );
  }, [allChampions, search]);

  // Get selected champion
  const selectedChampion = value
    ? allChampions.find((c) => c.championId === value)
    : null;

  const handleSelect = (championId: string) => {
    onChange(championId);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className={className}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-auto p-3 justify-start gap-3",
              !selectedChampion && "text-muted-foreground"
            )}
          >
            {selectedChampion ? (
              <>
                <ChampionIcon championId={selectedChampion.championId} size={48} />
                <div className="text-left">
                  <div className="font-semibold">{selectedChampion.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedChampion.title}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="size-12 rounded-lg bg-muted flex items-center justify-center">
                  <SearchIcon className="size-5 text-muted-foreground" />
                </div>
                <span>Sélectionner un champion</span>
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Sélectionner un champion</DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un champion..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Champions grid */}
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Chargement...
              </div>
            ) : filteredChampions.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Aucun champion trouvé
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-2">
                {filteredChampions.map((champion) => {
                  const isSelected = value === champion.championId;
                  return (
                    <button
                      key={champion.championId}
                      type="button"
                      onClick={() => handleSelect(champion.championId)}
                      className={cn(
                        "flex flex-col items-center p-2 rounded-lg transition-colors text-center",
                        isSelected
                          ? "bg-primary/20 ring-2 ring-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <ChampionIcon championId={champion.championId} size={48} />
                      <span className="text-xs mt-1 truncate w-full">
                        {champion.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
