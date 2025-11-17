"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2Icon, FilterIcon, ArrowUpIcon, ArrowDownIcon, ChevronsUpDownIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Script = {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  category: "sync" | "analysis" | "ops";
  payload?: () => Record<string, unknown>;
};

export const DataSyncTab = () => {
  const { t } = useI18n();
  const [runningScripts, setRunningScripts] = useState<Set<string>>(new Set());
  const [championAnalysisLimit, setChampionAnalysisLimit] = useState<number>(250);
  const [pendingScript, setPendingScript] = useState<Script | null>(null);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [availableMatches, setAvailableMatches] = useState<number | null>(null);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<'all' | Script['category']>('all');
  const [sortColumn, setSortColumn] = useState<'name' | 'category'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const scripts = useMemo<Script[]>(
    () => [
      {
        id: "sync-champions",
        name: t("admin.dataSync.scripts.syncChampions"),
        description: t("admin.dataSync.scripts.syncChampionsDesc"),
        endpoint: "/api/champions/sync",
        category: "sync",
      },
      {
        id: "sync-items",
        name: t("admin.dataSync.scripts.syncItems"),
        description: t("admin.dataSync.scripts.syncItemsDesc"),
        endpoint: "/api/items/sync",
        category: "sync",
      },
      {
        id: "sync-riot-versions",
        name: t("admin.dataSync.scripts.syncVersions"),
        description: t("admin.dataSync.scripts.syncVersionsDesc"),
        endpoint: "/api/admin/riot/versions",
        category: "sync",
      },
      {
        id: "analyze-champions",
        name: t("admin.dataSync.scripts.analyzeChampions"),
        description: t("admin.dataSync.scripts.analyzeChampionsDesc"),
        endpoint: "/api/admin/analyze-champions",
        category: "analysis",
        payload: () => ({ matchLimit: championAnalysisLimit || undefined }),
      },
      {
        id: "broadcast-notification",
        name: t("admin.dataSync.scripts.testNotification"),
        description: t("admin.dataSync.scripts.testNotificationDesc"),
        endpoint: "/api/notifications/send",
        category: "ops",
        payload: () => ({
          title: t("admin.dataSync.scripts.testNotification"),
          message: `Message envoyé à ${new Date().toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
          variant: "info",
        }),
      },
      {
        id: "sync-challenges",
        name: t("admin.dataSync.scripts.syncChallenges"),
        description: t("admin.dataSync.scripts.syncChallengesDesc"),
        endpoint: "/api/challenges/sync",
        category: "analysis",
      },
      {
        id: "generate-composition-suggestions",
        name: t("admin.dataSync.scripts.generateCompositions"),
        description: t("admin.dataSync.scripts.generateCompositionsDesc"),
        endpoint: "/api/admin/compositions/generate",
        category: "analysis",
      },
    ],
    [championAnalysisLimit, t]
  );

  const filteredScripts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let result = scripts.filter((script) => {
      const matchesCategory = categoryFilter === "all" || script.category === categoryFilter;
      const matchesSearch = term
        ? script.name.toLowerCase().includes(term) || script.description.toLowerCase().includes(term)
        : true;
      return matchesCategory && matchesSearch;
    });

    result = [...result].sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      if (sortColumn === 'category') {
        const categoryComparison = a.category.localeCompare(b.category, 'fr-FR');
        if (categoryComparison !== 0) {
          return categoryComparison * multiplier;
        }
        return a.name.localeCompare(b.name, 'fr-FR') * multiplier;
      }
      return a.name.localeCompare(b.name, 'fr-FR') * multiplier;
    });

    return result;
  }, [scripts, searchTerm, categoryFilter, sortColumn, sortDirection]);

  const toggleSort = (column: 'name' | 'category') => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (column: 'name' | 'category') => {
    if (sortColumn !== column) {
      return <ChevronsUpDownIcon className="ml-1 size-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUpIcon className="ml-1 size-4" />
    ) : (
      <ArrowDownIcon className="ml-1 size-4" />
    );
  };

  const executeScript = async (script: Script) => {
    if (runningScripts.has(script.id)) return;

    setRunningScripts((prev) => new Set(prev).add(script.id));
    try {
      const body = script.payload?.();
      const res = await authenticatedFetch(script.endpoint, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(json?.error || `Échec: ${script.name}`);
        return;
      }

      const message =
        script.id === "sync-champions"
          ? `Champions synchronisés (${json?.data?.total ?? "?"})`
          : script.id === "sync-items"
          ? `Items synchronisés (${json?.data?.total ?? json?.data?.created ?? "?"})`
          : script.id === "sync-riot-versions"
          ? `Versions mises à jour (${json?.data?.totalVersions ?? "?"} au total, patch courant ${json?.data?.currentVersion ?? "?"})`
          : script.id === "analyze-champions"
          ? `Analyse terminée: ${json?.data?.totalChampions ?? "?"} champions analysés (${json?.data?.created ?? 0} créés, ${json?.data?.updated ?? 0} mis à jour)`
          : script.id === "broadcast-notification"
          ? t("admin.dataSync.notificationSent")
          : script.id === "sync-challenges"
          ? `Défis synchronisés (${json?.data?.accountsProcessed ?? "?"} comptes)`
          : script.id === "generate-composition-suggestions"
          ? `Compositions générées (${json?.data?.totalSuggestions ?? "?"} suggestions)`
          : `Script ${script.name} terminé avec succès`;

      toast.success(message);
    } catch {
      toast.error(t("admin.dataSync.networkError"));
    } finally {
      setRunningScripts((prev) => {
        const next = new Set(prev);
        next.delete(script.id);
        return next;
      });
    }
  };

  const runScript = (script: Script) => {
    if (script.id === "analyze-champions") {
      setPendingScript(script);
      setIsPromptOpen(true);
      if (availableMatches === null && !isLoadingMatches) {
        setIsLoadingMatches(true);
        authenticatedFetch("/api/admin/matches/count")
          .then((response) => response.json())
          .then((json) => {
            if (json?.success && typeof json.data?.totalMatches === "number") {
              setAvailableMatches(json.data.totalMatches);
              if (!championAnalysisLimit) {
                setChampionAnalysisLimit(json.data.totalMatches);
              }
            }
          })
          .catch(() => {
            toast.error(t("admin.dataSync.errorFetchingMatches"));
          })
          .finally(() => setIsLoadingMatches(false));
      }
      return;
    }
    void executeScript(script);
  };

  const confirmChampionAnalysis = () => {
    const script = pendingScript;
    setIsPromptOpen(false);
    setPendingScript(null);
    if (!script) return;
    // Créer un script avec le payload mis à jour avec la valeur actuelle
    const scriptWithUpdatedPayload = {
      ...script,
      payload: () => ({
        matchLimit:
          championAnalysisLimit && championAnalysisLimit > 0
            ? championAnalysisLimit
            : undefined,
      }),
    };
    void executeScript(scriptWithUpdatedPayload);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-md border bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <FilterIcon className="size-4" />
            <span>{t("admin.dataSync.filterScripts")}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-1 min-w-[220px] flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">{t("admin.dataSync.search")}</span>
              <Input
                placeholder={t("admin.dataSync.searchPlaceholder")}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="flex min-w-[180px] flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">{t("admin.dataSync.category")}</span>
              <Select
                value={categoryFilter}
                onValueChange={(value: 'all' | Script['category']) => setCategoryFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.dataSync.allCategories")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.dataSync.all")}</SelectItem>
                  <SelectItem value="sync">{t("admin.dataSync.sync")}</SelectItem>
                  <SelectItem value="analysis">{t("admin.dataSync.analysis")}</SelectItem>
                  <SelectItem value="ops">{t("admin.dataSync.ops")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="w-[200px] cursor-pointer select-none"
                  onClick={() => toggleSort('name')}
                >
                  <span className="inline-flex items-center">
                    Script
                    {renderSortIcon('name')}
                  </span>
                </TableHead>
                <TableHead>{t("admin.dataSync.description")}</TableHead>
                <TableHead
                  className="w-[120px] cursor-pointer select-none"
                  onClick={() => toggleSort('category')}
                >
                  <span className="inline-flex items-center">
                    {t("admin.dataSync.category")}
                    {renderSortIcon('category')}
                  </span>
                </TableHead>
                <TableHead className="w-[120px] text-right">{t("admin.dataSync.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredScripts.map((script) => {
                const isRunning = runningScripts.has(script.id);
                return (
                  <TableRow key={script.id}>
                    <TableCell className="font-medium">{script.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {script.description}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          script.category === "sync"
                            ? "default"
                            : script.category === "analysis"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {script.category === "sync"
                          ? t("admin.dataSync.sync")
                          : script.category === "analysis"
                          ? t("admin.dataSync.analysis")
                          : t("admin.dataSync.ops")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => runScript(script)}
                        disabled={isRunning}
                        size="sm"
                      >
                        {isRunning ? (
                          <>
                            <Loader2Icon className="mr-2 size-4 animate-spin" />
                            {t("admin.dataSync.loading")}
                          </>
                        ) : (
                          t("admin.dataSync.run")
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isPromptOpen} onOpenChange={setIsPromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.dataSync.configureAnalysis")}</DialogTitle>
            <DialogDescription>
              Définis le nombre de matchs récents à inclure dans l'analyse des champions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="flex flex-col gap-2 text-sm">
              <span>{t("admin.dataSync.matchesAnalyzed")}</span>
              <Input
                type="number"
                value={championAnalysisLimit}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (!event.target.value) {
                    setChampionAnalysisLimit(0);
                    return;
                  }
                  setChampionAnalysisLimit(Number.isFinite(value) ? value : 0);
                }}
                placeholder={t("admin.dataSync.matchesAnalyzedPlaceholder")}
              />
              <span className="text-xs text-muted-foreground space-y-1">
                <span className="block">
                  Laisse vide pour analyser l'ensemble de la base.
                </span>
                <span className="block">
                  Matches disponibles :
                  <span className={cn("ml-1 font-semibold", isLoadingMatches && "opacity-60")}
                  >
                    {isLoadingMatches
                      ? t("admin.dataSync.loading")
                      : availableMatches !== null
                        ? availableMatches.toLocaleString("fr-FR")
                        : "—"}
                  </span>
                </span>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPromptOpen(false);
                setPendingScript(null);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={confirmChampionAnalysis}>{t("admin.dataSync.runAnalysis")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
