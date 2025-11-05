"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2Icon, DatabaseIcon } from "lucide-react";
import { toast } from "sonner";

interface SyncAccountsCardProps {
  onSyncComplete: () => void;
}

export function SyncAccountsCard({ onSyncComplete }: SyncAccountsCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncAccounts = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/admin/sync-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`${result.data.accountsCreated} comptes synchronisés`);
        onSyncComplete();
      } else {
        toast.error(result.error || "Erreur lors de la synchronisation");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card variant="gradient" className="md:col-span-2">
      <CardHeader withGlow>
        <CardTitle>Synchronisation des comptes</CardTitle>
        <CardDescription>
          Convertir les participants de matchs en comptes League of Legends
        </CardDescription>
        <CardAction>
          <Button
            onClick={handleSyncAccounts}
            disabled={isSyncing}
            className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            size="sm"
          >
            {isSyncing ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Sync...
              </>
            ) : (
              <>
                <DatabaseIcon className="mr-2 size-4" />
                Synchroniser
              </>
            )}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            Cette commande analyse tous les participants de matchs et crée des
            comptes League of Legends avec leurs statistiques calculées.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
