"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CounterPickTipsProps = {
  championName: string;
  tips: string[];
};

export const CounterPickTips = ({ championName, tips }: CounterPickTipsProps) => (
  <Card className="border-border/80 bg-background/95 shadow-sm">
    <CardHeader>
      <CardTitle className="text-xl font-semibold text-foreground">
        Conseils rapides
      </CardTitle>
      <CardDescription>
        En résumé, comment répondre à {championName}.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        {tips.map((tip, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="mt-1 size-1.5 rounded-full bg-primary" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);


