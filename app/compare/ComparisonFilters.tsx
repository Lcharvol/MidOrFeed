"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export const ComparisonFilters = ({
  player1Query,
  setPlayer1Query,
  player2Query,
  setPlayer2Query,
  region1,
  setRegion1,
  region2,
  setRegion2,
  onCompare,
  isSearching,
  isLoading,
}: {
  player1Query: string;
  setPlayer1Query: (v: string) => void;
  player2Query: string;
  setPlayer2Query: (v: string) => void;
  region1: string;
  setRegion1: (v: string) => void;
  region2: string;
  setRegion2: (v: string) => void;
  onCompare: () => void;
  isSearching: boolean;
  isLoading: boolean;
}) => (
  <Card className="mb-6 sm:mb-8 border-border/60 shadow-lg">
    <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Player 1 */}
        <div className="space-y-2 w-full">
          <label className="text-xs sm:text-sm font-medium flex items-center gap-2">
            <Badge emphasis="info" emphasisVariant="subtle" rounded="full" className="text-[10px] sm:text-xs px-2">
              Joueur 1
            </Badge>
          </label>
          <div className="flex gap-2">
            <Select value={region1} onValueChange={setRegion1}>
              <SelectTrigger className="w-20 sm:w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RIOT_REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <PlayerSearchInput
              value={player1Query}
              onChange={setPlayer1Query}
              region={region1}
              placeholder="Nom#TAG"
              className="flex-1"
            />
          </div>
        </div>

        {/* Player 2 */}
        <div className="space-y-2 w-full">
          <label className="text-xs sm:text-sm font-medium flex items-center gap-2">
            <Badge emphasis="danger" emphasisVariant="subtle" rounded="full" className="text-[10px] sm:text-xs px-2">
              Joueur 2
            </Badge>
          </label>
          <div className="flex gap-2">
            <Select value={region2} onValueChange={setRegion2}>
              <SelectTrigger className="w-20 sm:w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RIOT_REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <PlayerSearchInput
              value={player2Query}
              onChange={setPlayer2Query}
              region={region2}
              placeholder="Nom#TAG"
              className="flex-1"
            />
          </div>
        </div>

        <Button
          onClick={onCompare}
          disabled={isSearching || isLoading}
          size="default"
          className="w-full"
        >
          {isSearching || isLoading ? (
            <Loader2Icon className="size-4 animate-spin mr-2" />
          ) : (
            <SearchIcon className="size-4 mr-2" />
          )}
          Comparer
        </Button>
      </div>
    </CardContent>
  </Card>
);
