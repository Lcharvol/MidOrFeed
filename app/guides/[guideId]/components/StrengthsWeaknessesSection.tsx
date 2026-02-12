"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbsUpIcon, ThumbsDownIcon } from "lucide-react";

export const StrengthsWeaknessesSection = ({
  strengths,
  weaknesses,
}: {
  strengths: string[] | null;
  weaknesses: string[] | null;
}) => {
  if (!strengths?.length && !weaknesses?.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {strengths && strengths.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-success flex items-center gap-2">
              <ThumbsUpIcon className="size-4" />
              Points forts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {strengths.map((s, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-success">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {weaknesses && weaknesses.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-danger flex items-center gap-2">
              <ThumbsDownIcon className="size-4" />
              Points faibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {weaknesses.map((w, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-danger">-</span>
                  {w}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
