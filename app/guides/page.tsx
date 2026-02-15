"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  BookOpenIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon,
  HomeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  CopyIcon,
} from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import { toast } from "sonner";
import { useApiSWR, SEMI_DYNAMIC_CONFIG } from "@/lib/hooks/swr";
import { useI18n } from "@/lib/i18n-context";
import { GuideCard } from "./components/GuideCard";
import type { GuideListResponse, GuideRole } from "@/types/guides";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const PAGE_SIZE = 20;

const GuidesPage = () => {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<GuideRole | "all">("all");
  const [sort, setSort] = useState<"popular" | "recent" | "views">("popular");
  const [page, setPage] = useState(0);

  const roles = useMemo(() => [
    { value: "all" as const, label: t("guides.allRoles") },
    { value: "TOP" as const, label: "Top" },
    { value: "JUNGLE" as const, label: "Jungle" },
    { value: "MID" as const, label: "Mid" },
    { value: "ADC" as const, label: "ADC" },
    { value: "SUPPORT" as const, label: "Support" },
  ], [t]);

  const sortOptions = useMemo(() => [
    { value: "popular" as const, label: t("guides.sortPopular") },
    { value: "recent" as const, label: t("guides.sortRecent") },
    { value: "views" as const, label: t("guides.sortViews") },
  ], [t]);

  // Reset page when filters change
  const handleRoleChange = (v: GuideRole | "all") => { setRole(v); setPage(0); };
  const handleSortChange = (v: "popular" | "recent" | "views") => { setSort(v); setPage(0); };

  // Build API URL
  const params = new URLSearchParams();
  if (role !== "all") params.set("role", role);
  params.set("sort", sort);
  params.set("limit", String(PAGE_SIZE));
  params.set("offset", String(page * PAGE_SIZE));

  const { data, isLoading, error } = useApiSWR<ApiResponse<GuideListResponse>>(
    `/api/guides?${params.toString()}`,
    SEMI_DYNAMIC_CONFIG
  );

  const guides = data?.data?.guides ?? [];
  const total = data?.data?.total ?? 0;
  const hasMore = data?.data?.hasMore ?? false;

  // Filter by search locally (champion name in title)
  const filteredGuides = search
    ? guides.filter(
        (g) =>
          g.title.toLowerCase().includes(search.toLowerCase()) ||
          g.championId.toLowerCase().includes(search.toLowerCase())
      )
    : guides;

  return (
    <div className="container mx-auto px-4 py-10 space-y-10">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/"><HomeIcon className="size-4" /></Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("guides.breadcrumb")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpenIcon className="size-8 text-muted-foreground" />
            {t("guides.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("guides.subtitle")}
          </p>
        </div>
        <Button asChild>
          <Link href="/guides/create">
            <PlusIcon className="size-4 mr-2" />
            {t("guides.createGuide")}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="px-3 sm:px-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t("guides.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
              <Select
                value={role}
                onValueChange={(v) => handleRoleChange(v as GuideRole | "all")}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <FilterIcon className="size-4 mr-2 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sort}
                onValueChange={(v) =>
                  handleSortChange(v as "popular" | "recent" | "views")
                }
                disabled={isLoading}
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((s) => (
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
              <CardContent className="px-4">
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
            <CardContent className="px-8 text-center">
              <p className="text-muted-foreground">
                {t("guides.loadingError")}
              </p>
            </CardContent>
          </Card>
        ) : filteredGuides.length === 0 ? (
          // Empty state
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                {search ? <SearchIcon /> : <BookOpenIcon />}
              </EmptyMedia>
              <EmptyTitle>{t("guides.noGuideFound")}</EmptyTitle>
              <EmptyDescription>
                {search
                  ? t("guides.noGuideMatchSearch")
                  : t("guides.beFirstToCreate")}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/guides/create">
                  <PlusIcon className="size-4 mr-2" />
                  {t("guides.createGuide")}
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          // Guides list
          filteredGuides.map((guide) => (
            <ContextMenu key={guide.id}>
              <ContextMenuTrigger asChild>
                <div>
                  <GuideCard guide={guide} />
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  onClick={() => window.open(`/guides/${guide.id}`, "_blank")}
                >
                  <ExternalLinkIcon className="size-4" />
                  {t("guides.openNewTab")}
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => {
                    const url = `${window.location.origin}/guides/${guide.id}`;
                    navigator.clipboard.writeText(url).then(
                      () => toast.success(t("guides.linkCopied")),
                      () => toast.error(t("guides.linkCopyFailed"))
                    );
                  }}
                >
                  <CopyIcon className="size-4" />
                  {t("guides.copyLink")}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && total > PAGE_SIZE && !search && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("guides.showingRange")
              .replace("{start}", String(page * PAGE_SIZE + 1))
              .replace("{end}", String(Math.min((page + 1) * PAGE_SIZE, total)))
              .replace("{total}", String(total))}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              disabled={page === 0}
            >
              <ChevronLeftIcon className="size-4 mr-1" />
              {t("guides.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              disabled={!hasMore}
            >
              {t("guides.next")}
              <ChevronRightIcon className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuidesPage;
