"use client";

import { cn } from "@/lib/utils";
import { ROLE_ICON_MAP } from "@/components/icons/role-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { RoleData } from "./types";

interface PreferredRoleChartProps {
  roleData: RoleData[];
}

export const PreferredRoleChart = ({ roleData }: PreferredRoleChartProps) => {
  if (roleData.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col justify-between">
      <div className="text-xs font-medium text-muted-foreground">
        Rôle préféré (Classé)
      </div>
      <div className="flex items-end gap-4 h-[80px]">
        {roleData.map((role) => (
          <Tooltip key={role.role}>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center justify-end gap-1 flex-1 h-[120px] cursor-pointer">
                <div
                  className={cn(
                    "w-full rounded-t transition-all",
                    role.games > 0 ? "bg-primary" : "bg-muted"
                  )}
                  style={{
                    height: `${Math.max(role.percentage, 5)}%`,
                    minHeight: role.games > 0 ? "10px" : "0px",
                  }}
                />
                {(() => {
                  const RoleIcon =
                    ROLE_ICON_MAP[
                      role.role.toUpperCase() as keyof typeof ROLE_ICON_MAP
                    ];
                  return RoleIcon ? (
                    <RoleIcon className="size-4 text-muted-foreground" />
                  ) : (
                    <div className="text-[8px] text-muted-foreground">
                      {role.role}
                    </div>
                  );
                })()}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-semibold">{role.role}</p>
                <p className="text-xs text-muted-foreground">
                  {role.games} partie{role.games > 1 ? "s" : ""} · {role.percentage.toFixed(1)}%
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};
