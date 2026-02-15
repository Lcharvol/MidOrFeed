"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function OverviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Summoner overview error:", error);
  }, [error]);

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-lg">Erreur de chargement</CardTitle>
        <CardDescription>
          Impossible de charger les statistiques du joueur.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {process.env.NODE_ENV === "development" && (
          <div className="p-3 mb-4 bg-muted rounded-md">
            <p className="text-sm font-mono text-muted-foreground break-all">
              {error.message}
            </p>
          </div>
        )}
        <Button onClick={reset} variant="default" className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Recharger les statistiques
        </Button>
      </CardContent>
    </Card>
  );
}
