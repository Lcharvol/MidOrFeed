"use client";

import { useState } from "react";
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
import { Loader2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Script = {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  category: "sync" | "analysis" | "ops";
  payload?: () => Record<string, unknown>;
};

const scripts: Script[] = [
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
];

export const DataSyncTab = () => {
  const [runningScripts, setRunningScripts] = useState<Set<string>>(new Set());

  const runScript = async (script: Script) => {
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
          ? `Items synchronisés (${
              json?.data?.total ?? json?.data?.created ?? "?"
            })`
          : script.id === "sync-riot-versions"
          ? `Versions mises à jour (${json?.data?.totalVersions ?? "?"} au total, patch courant ${json?.data?.currentVersion ?? "?"})`
          : script.id === "analyze-champions"
          ? `Analyse terminée: ${
              json?.data?.totalChampions ?? "?"
            } champions analysés (${json?.data?.created ?? 0} créés, ${
              json?.data?.updated ?? 0
            } mis à jour)`
          : script.id === "broadcast-notification"
          ? "Notification envoyée"
          : script.id === "sync-challenges"
          ? `Défis synchronisés (${
              json?.data?.accountsProcessed ?? "?"
            } comptes)`
          : script.id === "generate-composition-suggestions"
          ? `Compositions générées (${
              json?.data?.totalSuggestions ?? "?"
            } suggestions)`
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

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Script</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[120px]">Catégorie</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scripts.map((script) => {
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
  );
};
