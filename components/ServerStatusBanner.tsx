"use client";

import { useState } from "react";
import { AlertTriangleIcon, WrenchIcon, XIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApiSWR } from "@/lib/hooks/swr";
import { cn } from "@/lib/utils";

type MaintenanceEntry = {
  id: number;
  status: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type IncidentEntry = {
  id: number;
  severity: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type StatusResponse = {
  success: boolean;
  data: {
    platform: string;
    platformName: string;
    hasIssues: boolean;
    maintenances: MaintenanceEntry[];
    incidents: IncidentEntry[];
  };
};

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  critical: {
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500/30",
  },
  warning: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
  },
  info: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
  },
};

const MAINTENANCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  scheduled: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
  },
  in_progress: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
  },
  complete: {
    bg: "bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-500/30",
  },
};

interface ServerStatusBannerProps {
  region?: string;
}

export function ServerStatusBanner({ region = "euw1" }: ServerStatusBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading } = useApiSWR<StatusResponse>(
    `/api/riot/status?region=${region}`,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000, // Refresh every minute
    }
  );

  // Don't render anything if loading, dismissed, or no issues
  if (isLoading || dismissed || !data?.data?.hasIssues) {
    return null;
  }

  const { maintenances, incidents, platformName } = data.data;
  const criticalIncidents = incidents.filter((i) => i.severity === "critical");
  const warningIncidents = incidents.filter((i) => i.severity === "warning");
  const infoIncidents = incidents.filter((i) => i.severity === "info");
  const activeMaintenances = maintenances.filter((m) => m.status !== "complete");

  // Determine banner style based on severity
  const hasCritical = criticalIncidents.length > 0;
  const hasWarning = warningIncidents.length > 0 || activeMaintenances.length > 0;

  const bannerStyle = hasCritical
    ? SEVERITY_COLORS.critical
    : hasWarning
      ? SEVERITY_COLORS.warning
      : SEVERITY_COLORS.info;

  const totalIssues = incidents.length + activeMaintenances.length;

  return (
    <div
      className={cn(
        "border-b",
        bannerStyle.bg,
        bannerStyle.border
      )}
    >
      <div className="container mx-auto px-4">
        {/* Main banner */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            {hasCritical ? (
              <AlertTriangleIcon className={cn("size-4", bannerStyle.text)} />
            ) : (
              <WrenchIcon className={cn("size-4", bannerStyle.text)} />
            )}
            <span className={cn("text-sm font-medium", bannerStyle.text)}>
              {platformName} - {totalIssues} probleme{totalIssues > 1 ? "s" : ""} en cours
            </span>
            <div className="hidden sm:flex items-center gap-2">
              {criticalIncidents.length > 0 && (
                <Badge variant="outline" className="bg-red-500/20 text-red-600 border-red-500/30 text-xs">
                  {criticalIncidents.length} critique{criticalIncidents.length > 1 ? "s" : ""}
                </Badge>
              )}
              {warningIncidents.length > 0 && (
                <Badge variant="outline" className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-xs">
                  {warningIncidents.length} avertissement{warningIncidents.length > 1 ? "s" : ""}
                </Badge>
              )}
              {activeMaintenances.length > 0 && (
                <Badge variant="outline" className="bg-blue-500/20 text-blue-600 border-blue-500/30 text-xs">
                  {activeMaintenances.length} maintenance{activeMaintenances.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-7 px-2"
            >
              {expanded ? (
                <ChevronUpIcon className="size-4" />
              ) : (
                <ChevronDownIcon className="size-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="h-7 px-2"
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="pb-3 space-y-2">
            {/* Incidents */}
            {incidents.map((incident) => {
              const colors = SEVERITY_COLORS[incident.severity] || SEVERITY_COLORS.info;
              return (
                <div
                  key={incident.id}
                  className={cn(
                    "p-2 rounded-md border",
                    colors.bg,
                    colors.border
                  )}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangleIcon className={cn("size-4 mt-0.5 shrink-0", colors.text)} />
                    <div className="min-w-0">
                      <div className={cn("text-sm font-medium", colors.text)}>
                        {incident.title}
                      </div>
                      {incident.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {incident.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Maintenances */}
            {activeMaintenances.map((maintenance) => {
              const colors = MAINTENANCE_COLORS[maintenance.status] || MAINTENANCE_COLORS.scheduled;
              return (
                <div
                  key={maintenance.id}
                  className={cn(
                    "p-2 rounded-md border",
                    colors.bg,
                    colors.border
                  )}
                >
                  <div className="flex items-start gap-2">
                    <WrenchIcon className={cn("size-4 mt-0.5 shrink-0", colors.text)} />
                    <div className="min-w-0">
                      <div className={cn("text-sm font-medium", colors.text)}>
                        {maintenance.title}
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          {maintenance.status === "in_progress" ? "En cours" :
                           maintenance.status === "scheduled" ? "Planifiee" : maintenance.status}
                        </Badge>
                      </div>
                      {maintenance.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {maintenance.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
