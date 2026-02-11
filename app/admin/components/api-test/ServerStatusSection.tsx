"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangleIcon,
  WrenchIcon,
  Loader2Icon,
  RefreshCwIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { StatusData } from "./types";

interface ServerStatusSectionProps {
  region: string;
}

export const ServerStatusSection = ({ region }: ServerStatusSectionProps) => {
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const testStatus = async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const res = await authenticatedFetch(`/api/riot/status?region=${region}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur API");
      }

      setStatusData(data);
      toast.success(
        data.data.hasIssues
          ? `${data.data.incidents.length + data.data.maintenances.length} probleme(s) detecte(s)`
          : "Aucun probleme detecte"
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setStatusError(message);
      toast.error(message);
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="size-5 text-amber-500" />
              Server Status (lol-status-v4)
            </CardTitle>
            <CardDescription>
              Verifie le statut des serveurs Riot pour la region
            </CardDescription>
          </div>
          <Button onClick={testStatus} disabled={statusLoading}>
            {statusLoading ? (
              <Loader2Icon className="size-4 animate-spin mr-2" />
            ) : (
              <RefreshCwIcon className="size-4 mr-2" />
            )}
            Tester
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {statusError && (
          <div className="flex items-center gap-2 text-destructive mb-4">
            <XCircleIcon className="size-4" />
            <span className="text-sm">{statusError}</span>
          </div>
        )}

        {statusData && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {statusData.data.hasIssues ? (
                <>
                  <AlertTriangleIcon className="size-5 text-amber-500" />
                  <span className="font-medium text-amber-600">
                    Problemes detectes sur {statusData.data.platformName}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="size-5 text-green-500" />
                  <span className="font-medium text-green-600">
                    {statusData.data.platformName} - Aucun probleme
                  </span>
                </>
              )}
            </div>

            {statusData.data.hasIssues && (
              <div className="space-y-2">
                {statusData.data.incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      incident.severity === "critical"
                        ? "bg-red-500/10 border-red-500/30"
                        : incident.severity === "warning"
                          ? "bg-amber-500/10 border-amber-500/30"
                          : "bg-blue-500/10 border-blue-500/30"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangleIcon className="size-4" />
                      <span className="font-medium">{incident.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {incident.severity}
                      </Badge>
                    </div>
                    {incident.description && (
                      <p className="text-sm text-muted-foreground">{incident.description}</p>
                    )}
                  </div>
                ))}

                {statusData.data.maintenances.map((maintenance) => (
                  <div
                    key={maintenance.id}
                    className="p-3 rounded-lg border bg-blue-500/10 border-blue-500/30"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <WrenchIcon className="size-4" />
                      <span className="font-medium">{maintenance.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {maintenance.status}
                      </Badge>
                    </div>
                    {maintenance.description && (
                      <p className="text-sm text-muted-foreground">{maintenance.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!statusData && !statusError && !statusLoading && (
          <div className="text-sm text-muted-foreground">
            Cliquez sur Tester pour verifier le statut des serveurs
          </div>
        )}
      </CardContent>
    </Card>
  );
};
