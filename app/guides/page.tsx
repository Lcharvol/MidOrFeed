"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ChampionIcon } from "@/components/ChampionIcon";
import {
  BookOpenIcon,
  PlusIcon,
  SearchIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  EyeIcon,
  FilterIcon,
} from "lucide-react";
import { useApiSWR, SEMI_DYNAMIC_CONFIG } from "@/lib/hooks/swr";
import { useI18n } from "@/lib/i18n-context";
import type { GuideSummary, GuideListResponse, GuideRole } from "@/types/guides";

const ROLES: { value: GuideRole | "all"; label: string }[] = [
  { value: "all", label: "Tous les rôles" },
  { value: "TOP", label: "Top" },
  { value: "JUNGLE", label: "Jungle" },
  { value: "MID", label: "Mid" },
  { value: "ADC", label: "ADC" },
  { value: "SUPPORT", label: "Support" },
];

const SORT_OPTIONS = [
  { value: "popular", label: "Populaires" },
  { value: "recent", label: "Récents" },
  { value: "views", label: "Plus vus" },
];

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const GuideCard = ({ guide }: { guide: GuideSummary }) => {
  const netVotes = guide.upvotes - guide.downvotes;

  return (
    <Link href={`/guides/${guide.id}`}>
      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="p-3 sm:p-4">
          <div className="flex gap-3 sm:gap-4">
            {/* Champion icon */}
            <div className="shrink-0">
              <ChampionIcon championId={guide.championId} size={48} className="sm:size-14" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm sm:text-base truncate">{guide.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    par {guide.authorName || "Anonyme"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {guide.role && (
                    <Badge variant="secondary" className="text-xs hidden xs:inline-flex">
                      {guide.role}
                    </Badge>
                  )}
                  {/* Score - visible on all screens */}
                  <div
                    className={`text-sm sm:text-base font-bold px-2 py-0.5 rounded ${
                      netVotes > 0
                        ? "text-green-500 bg-green-500/10"
                        : netVotes < 0
                          ? "text-red-500 bg-red-500/10"
                          : "text-muted-foreground bg-muted"
                    }`}
                  >
                    {netVotes > 0 ? `+${netVotes}` : netVotes}
                  </div>
                </div>
              </div>

              {guide.introduction && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 line-clamp-2 hidden sm:block">
                  {guide.introduction}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ThumbsUpIcon className="size-3 sm:size-3.5" />
                  <span>{guide.upvotes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsDownIcon className="size-3 sm:size-3.5" />
                  <span>{guide.downvotes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <EyeIcon className="size-3 sm:size-3.5" />
                  <span>{guide.viewCount}</span>
                </div>
                {guide.patchVersion && (
                  <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                    {guide.patchVersion}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const GuidesPage = () => {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<GuideRole | "all">("all");
  const [sort, setSort] = useState<"popular" | "recent" | "views">("popular");

  // Build API URL
  const params = new URLSearchParams();
  if (role !== "all") params.set("role", role);
  params.set("sort", sort);
  params.set("limit", "20");

  const { data, isLoading, error } = useApiSWR<ApiResponse<GuideListResponse>>(
    `/api/guides?${params.toString()}`,
    SEMI_DYNAMIC_CONFIG
  );

  const guides = data?.data?.guides ?? [];

  // Filter by search locally (champion name in title)
  const filteredGuides = search
    ? guides.filter(
        (g) =>
          g.title.toLowerCase().includes(search.toLowerCase()) ||
          g.championId.toLowerCase().includes(search.toLowerCase())
      )
    : guides;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpenIcon className="size-8 text-primary" />
            Guides Champions
          </h1>
          <p className="text-muted-foreground mt-1">
            Découvrez les meilleurs guides créés par la communauté
          </p>
        </div>
        <Button asChild>
          <Link href="/guides/create">
            <PlusIcon className="size-4 mr-2" />
            Créer un guide
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
              <Select
                value={role}
                onValueChange={(v) => setRole(v as GuideRole | "all")}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <FilterIcon className="size-4 mr-2 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sort}
                onValueChange={(v) =>
                  setSort(v as "popular" | "recent" | "views")
                }
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guides List */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="size-14 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : error || data?.success === false ? (
          // Error state
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                Erreur lors du chargement des guides
              </p>
            </CardContent>
          </Card>
        ) : filteredGuides.length === 0 ? (
          // Empty state
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpenIcon className="size-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">Aucun guide trouvé</h3>
              <p className="text-muted-foreground mb-4">
                {search
                  ? "Aucun guide ne correspond à votre recherche"
                  : "Soyez le premier à créer un guide !"}
              </p>
              <Button asChild>
                <Link href="/guides/create">
                  <PlusIcon className="size-4 mr-2" />
                  Créer un guide
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Guides list
          filteredGuides.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))
        )}
      </div>
    </div>
  );
};

export default GuidesPage;
