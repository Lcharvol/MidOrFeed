"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon, Loader2Icon } from "lucide-react";
import { RIOT_REGIONS } from "@/lib/riot-regions";
import { PlayerSearchInput } from "@/components/PlayerSearchInput";

interface HeroSearchSectionProps {
  query: string;
  setQuery: (value: string) => void;
  region: string;
  setRegion: (value: string) => void;
  isSearching: boolean;
  formatHint: string | null;
  setFormatHint: (value: string | null) => void;
  onSearch: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSelectResult: (result: { puuid: string; region: string }) => void;
}

export function HeroSearchSection({
  query,
  setQuery,
  region,
  setRegion,
  isSearching,
  formatHint,
  setFormatHint,
  onSearch,
  onKeyDown,
  onSelectResult,
}: HeroSearchSectionProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="container relative mx-auto px-4 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-up">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Rechercher un{" "}
            <span className="text-primary">Invocateur</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Consultez les statistiques detaillees, l&apos;historique des matchs et les performances de n&apos;importe quel joueur.
          </p>

          {/* Search Box */}
          <Card className="mt-8 border-border/60 shadow-md bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-3" onKeyDown={onKeyDown}>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="w-full sm:w-28">
                    <SelectValue placeholder="Region" />
                  </SelectTrigger>
                  <SelectContent>
                    {RIOT_REGIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex-1 space-y-1">
                  <PlayerSearchInput
                    value={query}
                    onChange={(v) => {
                      setQuery(v);
                      if (formatHint) setFormatHint(null);
                    }}
                    region={region}
                    placeholder="Nom#TAG (ex: Faker#KR1)"
                    onSelect={onSelectResult}
                  />
                  {formatHint && (
                    <p className="text-xs text-destructive px-1">{formatHint}</p>
                  )}
                </div>

                <Button
                  onClick={onSearch}
                  disabled={isSearching}
                  size="lg"
                  className="w-full sm:w-auto"
                  aria-label="Rechercher un joueur"
                >
                  {isSearching ? (
                    <Loader2Icon className="size-5 animate-spin" />
                  ) : (
                    <>
                      <SearchIcon className="size-5 mr-2" />
                      Rechercher
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
