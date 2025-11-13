"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RolePerformanceEntry } from "@/lib/summoners/overview";

interface RolePerformanceSectionProps {
  entries: RolePerformanceEntry[];
}

export const RolePerformanceSection = ({
  entries,
}: RolePerformanceSectionProps) => {
  if (entries.length === 0) return null;

  return (
    <Card className="border-border/70 bg-background/90 shadow-sm">
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-base font-semibold text-foreground">
          Performance par rôle
        </CardTitle>
        <CardDescription className="text-xs">
          Win rate moyen par position (surface proportionnelle aux
          performances).
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4 pt-0">
        {/* Le radar chart est maintenant affiché dans une card séparée en haut de la page */}
        <p className="text-sm text-muted-foreground">
          Consultez le graphique radar en haut de la page pour visualiser les
          performances par rôle.
        </p>
      </CardContent>
    </Card>
  );
};
