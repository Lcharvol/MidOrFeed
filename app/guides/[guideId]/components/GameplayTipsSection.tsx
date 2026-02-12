"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const GameplayTipsSection = ({
  early,
  mid,
  late,
}: {
  early: string | null;
  mid: string | null;
  late: string | null;
}) => {
  if (!early && !mid && !late) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conseils de jeu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {early && (
          <div>
            <h4 className="font-medium text-sm mb-1">Early Game</h4>
            <p className="text-muted-foreground whitespace-pre-line">{early}</p>
          </div>
        )}
        {mid && (
          <div>
            <h4 className="font-medium text-sm mb-1">Mid Game</h4>
            <p className="text-muted-foreground whitespace-pre-line">{mid}</p>
          </div>
        )}
        {late && (
          <div>
            <h4 className="font-medium text-sm mb-1">Late Game</h4>
            <p className="text-muted-foreground whitespace-pre-line">{late}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
