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

  const featured = results[0];
  const rest = results.slice(1);

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
            {t("searchResults.clear")}
          </Button>
        </div>

        <div className="space-y-3">
          {/* Featured first result */}
          <Card variant="interactive" className="group border-primary/30">
            <CardContent className="px-4">
              <Link
                href={`/summoners/${featured.puuid}/overview?region=${featured.region}`}
                className="flex items-center gap-4"
              >
                <Avatar className="size-14 border-2 border-primary/20">
                  {featured.profileIconId ? (
                    <AvatarImage
                      src={getProfileIconUrl(featured.profileIconId)}
                      alt={featured.gameName || ""}
                    />
                  ) : null}
                  <AvatarFallback className="text-lg">
                    {featured.gameName?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                    {featured.gameName || "Unknown"}
                    {featured.tagLine && (
                      <span className="text-muted-foreground text-sm ml-1">
                        #{featured.tagLine}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <Badge emphasis="info" emphasisVariant="subtle" className="text-xs">
                      {featured.region.toUpperCase()}
                    </Badge>
                    {typeof featured.stats?.totalMatches === "number" &&
                      featured.stats.totalMatches > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {featured.stats.totalMatches} {t("common.games")}
                        </span>
                      )}
                    {typeof featured.stats?.winRate === "number" &&
                      featured.stats.winRate > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {featured.stats.winRate.toFixed(0)}% WR
                        </span>
                      )}
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Remaining results in grid */}
          {rest.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rest.map((result) => (
                <Card key={`${result.puuid}-${result.region}`} variant="interactive" className="group">
                  <CardContent className="px-3">
                    <Link
                      href={`/summoners/${result.puuid}/overview?region=${result.region}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar className="size-10 border-0">
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
          )}
        </div>
      </div>
    </div>
  );
}
