"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/api-client";
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
        name: "Synchroniser les champions",
        description: "Récupère la dernière liste depuis Data Dragon",
        endpoint: "/api/champions/sync",
        category: "sync",
      },
      {
        id: "sync-items",
        name: "Synchroniser les items",
        description: "Met à jour les objets (icônes, coûts, descriptions)",
        endpoint: "/api/items/sync",
        category: "sync",
      },
      {
        id: "sync-riot-versions",
        name: "Synchroniser les versions du jeu",
        description:
          "Récupère la liste des patches via l’API Riot et met à jour la version courante",
        endpoint: "/api/admin/riot/versions",
        category: "sync",
      },
      {
        id: "analyze-champions",
        name: "Analyser les statistiques de champions",
        description:
          "Analyse les matches et calcule les statistiques de performance par champion",
        endpoint: "/api/admin/analyze-champions",
        category: "analysis",
        payload: () => ({ matchLimit: championAnalysisLimit || undefined }),
      },
      {
        id: "broadcast-notification",
        name: "Notification de test",
        description:
          "Envoie une notification temps réel à toutes les sessions connectées",
        endpoint: "/api/notifications/send",
        category: "ops",
        payload: () => ({
          title: "Notification de test",
          message: `Message envoyé à ${new Date().toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
          variant: "info",
        }),
      },
      {
        id: "sync-challenges",
        name: "Synchroniser les défis Riot",
        description:
          "Récupère la configuration et la progression Challenges pour les comptes suivis",
        endpoint: "/api/challenges/sync",
        category: "analysis",
      },
      {
        id: "generate-composition-suggestions",
        name: "Générer les compositions recommandées",
        description:
          "Produit des suggestions d’équipe par rôle à partir des statistiques de champions",
        endpoint: "/api/admin/compositions/generate",
        category: "analysis",
      },
    ],
    [championAnalysisLimit]
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
          ? "Notification envoyée"
          : script.id === "sync-challenges"
          ? `Défis synchronisés (${json?.data?.accountsProcessed ?? "?"} comptes)`
          : script.id === "generate-composition-suggestions"
          ? `Compositions générées (${json?.data?.totalSuggestions ?? "?"} suggestions)`
          : `Script ${script.name} terminé avec succès`;

      toast.success(message);
    } catch {
      toast.error("Erreur réseau");
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
            toast.error("Impossible de récupérer le nombre de matchs disponibles");
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
    void executeScript(script);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-md border bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <FilterIcon className="size-4" />
            <span>Filtrer les scripts</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-1 min-w-[220px] flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Recherche</span>
              <Input
                placeholder="Rechercher par nom ou description"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="flex min-w-[180px] flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Catégorie</span>
              <Select
                value={categoryFilter}
                onValueChange={(value: 'all' | Script['category']) => setCategoryFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="sync">Synchronisation</SelectItem>
                  <SelectItem value="analysis">Analyse</SelectItem>
                  <SelectItem value="ops">Ops</SelectItem>
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
                <TableHead>Description</TableHead>
                <TableHead
                  className="w-[120px] cursor-pointer select-none"
                  onClick={() => toggleSort('category')}
                >
                  <span className="inline-flex items-center">
                    Catégorie
                    {renderSortIcon('category')}
                  </span>
                </TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
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
                          ? "Synchronisation"
                          : script.category === "analysis"
                          ? "Analyse"
                          : "Ops"}
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
                            En cours...
                          </>
                        ) : (
                          "Lancer"
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
            <DialogTitle>Configurer l’analyse</DialogTitle>
            <DialogDescription>
              Définis le nombre de matchs récents à inclure dans l’analyse des champions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="flex flex-col gap-2 text-sm">
              <span>Matches analysés</span>
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
                placeholder="Ex: 250"
              />
              <span className="text-xs text-muted-foreground space-y-1">
                <span className="block">
                  Laisse vide pour analyser l’ensemble de la base.
                </span>
                <span className="block">
                  Matches disponibles :
                  <span className={cn("ml-1 font-semibold", isLoadingMatches && "opacity-60")}
                  >
                    {isLoadingMatches
                      ? "Chargement..."
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
              Annuler
            </Button>
            <Button onClick={confirmChampionAnalysis}>Lancer l’analyse</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
