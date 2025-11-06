"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2Icon } from "lucide-react";

interface StatusBreakdownCardProps {
  byStatus: Record<string, number>;
  loading?: boolean;
}

const statusColors = {
  pending:
    "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-500",
  crawling:
    "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-500",
  completed:
    "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-500",
  failed: "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-500",
};

const statusIcons: Record<string, string> = {
  pending: "⏳",
  crawling: "🔄",
  completed: "✅",
  failed: "❌",
};

export function StatusBreakdownCard({
  byStatus,
  loading = false,
}: StatusBreakdownCardProps) {
  return (
    <Card variant="gradient">
      <CardHeader withGlow>
        <CardTitle>Répartition par statut</CardTitle>
        <CardDescription>
          État actuel de tous les joueurs découverts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          {loading ? (
            <div className="col-span-4 flex items-center justify-center py-8">
              <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {Object.entries(byStatus).map(([status, count]) => (
                <div
                  key={status}
                  className={`flex flex-col items-start gap-3 rounded-lg border-2 p-4 transition-all hover:scale-105 hover:shadow-lg ${
                    statusColors[status as keyof typeof statusColors] ||
                    "bg-muted border-border"
                  }`}
                >
                  <div className="flex items-center gap-2 w-full justify-between">
                    <span className="text-2xl">
                      {statusIcons[status] || "📊"}
                    </span>
                    <Badge variant="secondary" className="font-mono">
                      {count}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium capitalize">{status}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
