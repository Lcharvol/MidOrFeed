"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SearchIcon, ChevronRightIcon } from "lucide-react";
import { formatRelativeDate } from "@/lib/format-date";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import type { RecentSearch } from "@/lib/hooks/use-recent-search";

interface RecentSearchesProps {
  recentSearches: RecentSearch[];
}

export function RecentSearches({ recentSearches }: RecentSearchesProps) {
  const { t } = useI18n();

  if (recentSearches.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <SearchIcon className="size-5 text-muted-foreground" />
        {t("homeSearch.recentSearches")}
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {recentSearches.map((s) => (
          <Card key={`${s.puuid}-${s.region}`} variant="interactive" className="group">
            <CardContent className="p-3">
              <Link
                href={`/summoners/${s.puuid}/overview?region=${s.region}`}
                className="flex items-center gap-3"
              >
                <Avatar className="size-10 border border-primary/20">
                  <AvatarFallback className="text-sm">
                    {s.gameName[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {s.gameName}
                    <span className="text-muted-foreground text-xs">#{s.tagLine}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge emphasis="info" emphasisVariant="subtle" className="text-[10px]">
                      {s.region.toUpperCase()}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelativeDate(s.timestamp)}
                    </span>
                  </div>
                </div>
                <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
