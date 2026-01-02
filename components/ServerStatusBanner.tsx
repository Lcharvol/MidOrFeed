"use client";

import { useState } from "react";
import { AlertTriangleIcon, WrenchIcon, XIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApiSWR } from "@/lib/hooks/swr";
import { cn } from "@/lib/utils";
import { SEVERITY_STYLES, STATUS_STYLES } from "@/lib/styles/game-colors";

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

// Map severity to design system styles
const getSeverityColors = (severity: string) => {
  switch (severity) {
    case "critical":
      return SEVERITY_STYLES.critical;
    case "warning":
      return SEVERITY_STYLES.major;
    case "info":
    default:
      return SEVERITY_STYLES.minor;
  }
};

// Map maintenance status to design system styles
const getMaintenanceColors = (status: string) => {
  switch (status) {
    case "in_progress":
      return STATUS_STYLES.warning;
    case "complete":
      return STATUS_STYLES.success;
    case "scheduled":
    default:
      return STATUS_STYLES.info;
  }
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
    ? SEVERITY_STYLES.critical
    : hasWarning
      ? SEVERITY_STYLES.major
      : SEVERITY_STYLES.minor;

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
                <Badge variant="destructive" className="text-xs">
                  {criticalIncidents.length} critique{criticalIncidents.length > 1 ? "s" : ""}
                </Badge>
              )}
              {warningIncidents.length > 0 && (
                <Badge variant="warning" className="text-xs">
                  {warningIncidents.length} avertissement{warningIncidents.length > 1 ? "s" : ""}
                </Badge>
              )}
              {activeMaintenances.length > 0 && (
                <Badge variant="info" className="text-xs">
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
              const colors = getSeverityColors(incident.severity);
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
              const colors = getMaintenanceColors(maintenance.status);
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
