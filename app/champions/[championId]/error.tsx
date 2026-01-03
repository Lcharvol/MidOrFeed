"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, List } from "lucide-react";
import Link from "next/link";

export default function ChampionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Champion page error:", error);
  }, [error]);

  return (
    <div className="container mx-auto py-20 px-4">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Erreur de chargement</CardTitle>
          <CardDescription>
            Impossible de charger les informations du champion.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-mono text-muted-foreground break-all">
                {error.message}
              </p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={reset} variant="default" className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/tier-list/champions">
                <List className="mr-2 h-4 w-4" />
                Tier List
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
