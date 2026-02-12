"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function GuideError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Guide error:", error);
  }, [error]);

  return (
    <div className="container mx-auto py-20 px-4">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Impossible de charger ce guide</CardTitle>
          <CardDescription>
            Le guide est peut-être indisponible ou a été supprimé.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button onClick={reset} variant="default" className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/guides">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tous les guides
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
