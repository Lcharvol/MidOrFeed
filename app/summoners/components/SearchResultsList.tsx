"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchIcon, XIcon, UserIcon } from "lucide-react";
import { getProfileIconUrl } from "@/constants/ddragon";
import { useI18n } from "@/lib/i18n-context";
import Link from "next/link";

type SearchResult = {
  puuid: string;
  gameName?: string | null;
  tagLine?: string | null;
  region: string;
  profileIconId?: number | null;
  level?: number | null;
  stats?: { totalMatches?: number; winRate?: number; avgKDA?: number };
};

interface SearchResultsListProps {
  results: SearchResult[];
  query: string;
  isNoResults: boolean;
  onClear: () => void;
}

export function SearchResultsList({
  results,
  query,
  isNoResults,
  onClear,
}: SearchResultsListProps) {
  const { t } = useI18n();

  if (isNoResults) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <SearchIcon className="size-5 text-muted-foreground" />
              {t("searchResults.resultsFor")} &quot;{query}&quot;
            </h2>
            <Button variant="ghost" size="sm" onClick={onClear}>
              <XIcon className="size-4 mr-1" />
              {t("searchResults.clear")}
            </Button>
          </div>
          <Card>
            <CardContent className="text-center">
              <UserIcon className="size-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                {t("searchResults.noPlayerFound")} &quot;{query}&quot;
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {t("searchResults.tryFormat")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (results.length === 0) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <SearchIcon className="size-5 text-muted-foreground" />
            {results.length} {t("searchResults.result")}{results.length > 1 ? "s" : ""} — &quot;{query}&quot;
          </h2>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <XIcon className="size-4 mr-1" />
            Effacer
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {results.map((result) => (
            <Card key={`${result.puuid}-${result.region}`} variant="interactive" className="group">
              <CardContent className="px-3">
                <Link
                  href={`/summoners/${result.puuid}/overview?region=${result.region}`}
                  className="flex items-center gap-3"
                >
                  <Avatar className="size-10 border border-primary/20">
                    {result.profileIconId ? (
                      <AvatarImage
                        src={getProfileIconUrl(result.profileIconId)}
                        alt={result.gameName || ""}
                      />
                    ) : null}
                    <AvatarFallback className="text-sm">
                      {result.gameName?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {result.gameName || "Unknown"}
                      {result.tagLine && (
                        <span className="text-muted-foreground text-xs">
                          #{result.tagLine}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge emphasis="info" emphasisVariant="subtle" className="text-[10px]">
                        {result.region.toUpperCase()}
                      </Badge>
                      {typeof result.stats?.totalMatches === "number" &&
                        result.stats.totalMatches > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {result.stats.totalMatches} {t("common.games")}
                          </span>
                        )}
                      {typeof result.stats?.winRate === "number" &&
                        result.stats.winRate > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {result.stats.winRate.toFixed(0)}% WR
                          </span>
                        )}
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
