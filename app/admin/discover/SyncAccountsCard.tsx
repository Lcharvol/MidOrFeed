"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2Icon,
  DatabaseIcon,
  CheckCircle2Icon,
  UsersIcon,
  TrendingUpIcon,
} from "lucide-react";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n-context";

interface SyncAccountsCardProps {
  onSyncComplete: () => void;
}

interface SyncResult {
  totalPUUIDs: number;
  accountsCreated: number;
  accountsUpdated: number;
}

export function SyncAccountsCard({ onSyncComplete }: SyncAccountsCardProps) {
  const { t } = useI18n();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [estimatedProgress, setEstimatedProgress] = useState(0);

  // Simulation de progression pendant la synchronisation
  useEffect(() => {
    if (!isSyncing) {
      setEstimatedProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setEstimatedProgress((prev) => {
        // Progresser lentement jusqu'à 90%, puis attendre la fin réelle
        if (prev < 90) {
          return prev + Math.random() * 5;
        }
        return prev;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isSyncing]);

  const handleSyncAccounts = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    setEstimatedProgress(0);

    try {
      const response = await authenticatedFetch("/api/admin/sync-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (response.ok) {
        setEstimatedProgress(100);
        setSyncResult({
          totalPUUIDs: result.data.totalPUUIDs || 0,
          accountsCreated: result.data.accountsCreated || 0,
          accountsUpdated: result.data.accountsUpdated || 0,
        });
        toast.success(
          t("admin.discover.syncAccountsCard.accountsSynced").replace(
            "{count}",
            result.data.accountsCreated.toString()
          )
        );
        onSyncComplete();
      } else {
        toast.error(
          result.error || t("admin.discover.syncAccountsCard.errorSync")
        );
        setSyncResult(null);
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(t("admin.discover.syncAccountsCard.errorOccurred"));
      setSyncResult(null);
    } finally {
      setIsSyncing(false);
      setEstimatedProgress(0);
    }
  };

  return (
    <Card variant="gradient" className="md:col-span-2">
      <CardHeader withGlow>
        <CardTitle className="flex items-center gap-2">
          <DatabaseIcon className="size-5 text-blue-500" />
          {t("admin.discover.syncAccountsCard.title")}
        </CardTitle>
        <CardDescription>
          {t("admin.discover.syncAccountsCard.description")}
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
                {t("admin.discover.syncAccountsCard.syncing")}
              </>
            ) : (
              <>
                <DatabaseIcon className="mr-2 size-4" />
                {t("admin.discover.syncAccountsCard.sync")}
              </>
            )}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barre de progression */}
        {isSyncing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Loader2Icon className="size-3 animate-spin" />
                {t("admin.discover.syncAccountsCard.processing")}
              </span>
              <span className="font-medium">
                {Math.round(estimatedProgress)}%
              </span>
            </div>
            <Progress value={estimatedProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {t("admin.discover.syncAccountsCard.processingDescription")}
            </p>
          </div>
        )}

        {/* Résultats de la synchronisation */}
        {syncResult && !isSyncing && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CheckCircle2Icon className="size-4 text-green-500" />
              {t("admin.discover.syncAccountsCard.syncCompleted")}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1 rounded-md bg-background/50 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <UsersIcon className="size-3" />
                  {t("admin.discover.syncAccountsCard.totalPUUIDs")}
                </div>
                <div className="text-lg font-bold text-foreground">
                  {syncResult.totalPUUIDs.toLocaleString()}
                </div>
              </div>
              <div className="flex flex-col gap-1 rounded-md bg-background/50 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2Icon className="size-3 text-green-500" />
                  {t("admin.discover.syncAccountsCard.accountsCreated")}
                </div>
                <div className="text-lg font-bold text-green-600">
                  {syncResult.accountsCreated.toLocaleString()}
                </div>
              </div>
              <div className="flex flex-col gap-1 rounded-md bg-background/50 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUpIcon className="size-3 text-blue-500" />
                  {t("admin.discover.syncAccountsCard.accountsUpdated")}
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {syncResult.accountsUpdated.toLocaleString()}
                </div>
              </div>
            </div>
            {syncResult.totalPUUIDs > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {t("admin.discover.syncAccountsCard.successRate")}:{" "}
                  {(
                    ((syncResult.accountsCreated + syncResult.accountsUpdated) /
                      syncResult.totalPUUIDs) *
                    100
                  ).toFixed(1)}
                  %
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Information générale */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {t("admin.discover.syncAccountsCard.whatItDoes")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("admin.discover.syncAccountsCard.commandDescription")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                <DatabaseIcon className="mr-1 size-3" />
                {t("admin.discover.syncAccountsCard.createsAccounts")}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <TrendingUpIcon className="mr-1 size-3" />
                {t("admin.discover.syncAccountsCard.updatesStats")}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <UsersIcon className="mr-1 size-3" />
                {t("admin.discover.syncAccountsCard.fetchRiotData")}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
