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
  category: "sync" | "analysis";
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
    id: "analyze-champions",
    name: "Analyser les statistiques de champions",
    description:
      "Analyse les matches et calcule les statistiques de performance par champion",
    endpoint: "/api/admin/analyze-champions",
    category: "analysis",
  },
];

export const DataSyncTab = () => {
  const [runningScripts, setRunningScripts] = useState<Set<string>>(new Set());

  const runScript = async (script: Script) => {
    if (runningScripts.has(script.id)) return;

    setRunningScripts((prev) => new Set(prev).add(script.id));
    try {
      const res = await authenticatedFetch(script.endpoint, {
        method: "POST",
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
          : script.id === "analyze-champions"
          ? `Analyse terminée: ${
              json?.data?.totalChampions ?? "?"
            } champions analysés (${json?.data?.created ?? 0} créés, ${
              json?.data?.updated ?? 0
            } mis à jour)`
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
                        script.category === "sync" ? "default" : "secondary"
                      }
                    >
                      {script.category === "sync"
                        ? "Synchronisation"
                        : "Analyse"}
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
