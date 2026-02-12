"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrophyIcon,
  ChevronRightIcon,
  BarChart3Icon,
  SwordsIcon,
  TargetIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";

export function FeatureCards() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="group hover:bg-accent/50 hover:shadow-md transition-all">
        <CardContent className="p-6 space-y-3">
          <div className="size-12 rounded-lg bg-info-muted flex items-center justify-center">
            <BarChart3Icon className="size-6 text-info" />
          </div>
          <h3 className="font-semibold text-lg">Statistiques detaillees</h3>
          <p className="text-sm text-muted-foreground">
            KDA, winrate, CS/min, vision score et bien plus encore.
          </p>
        </CardContent>
      </Card>

      <Card className="group hover:bg-accent/50 hover:shadow-md transition-all">
        <CardContent className="p-6 space-y-3">
          <div className="size-12 rounded-lg bg-danger-muted flex items-center justify-center">
            <SwordsIcon className="size-6 text-danger" />
          </div>
          <h3 className="font-semibold text-lg">Historique des matchs</h3>
          <p className="text-sm text-muted-foreground">
            Analysez chaque partie avec des details complets sur les performances.
          </p>
        </CardContent>
      </Card>

      <Card className="group hover:bg-accent/50 hover:shadow-md transition-all">
        <CardContent className="p-6 space-y-3">
          <div className="size-12 rounded-lg bg-warning-muted flex items-center justify-center">
            <TrophyIcon className="size-6 text-warning" />
          </div>
          <h3 className="font-semibold text-lg">Classement</h3>
          <p className="text-sm text-muted-foreground">
            Suivez la progression en ranked Solo/Duo et Flex.
          </p>
        </CardContent>
      </Card>

      <Card className="group hover:bg-accent/50 hover:shadow-md transition-all">
        <CardContent className="p-6 space-y-3">
          <div className="size-12 rounded-lg bg-success-muted flex items-center justify-center">
            <TargetIcon className="size-6 text-success" />
          </div>
          <h3 className="font-semibold text-lg">Champions maitrise</h3>
          <p className="text-sm text-muted-foreground">
            Decouvrez les champions les plus joues et leur performance.
          </p>
        </CardContent>
      </Card>

      <Card className="group hover:bg-accent/50 transition-colors sm:col-span-2 lg:col-span-2">
        <CardContent className="p-6 flex items-center gap-6">
          <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <UserIcon className="size-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Comparer des joueurs</h3>
            <p className="text-sm text-muted-foreground">
              Comparez les statistiques de deux joueurs cote a cote pour une analyse approfondie.
            </p>
          </div>
          <Button variant="outline" asChild className="shrink-0">
            <Link href="/compare">
              Comparer
              <ChevronRightIcon className="size-4 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
