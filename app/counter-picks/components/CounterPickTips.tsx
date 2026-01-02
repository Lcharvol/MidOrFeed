"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LightbulbIcon,
  ShieldAlertIcon,
  SwordsIcon,
  ZapIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CounterPickTipsProps = {
  championName: string;
  tips: string[];
};

const getTipIcon = (index: number) => {
  switch (index) {
    case 0:
      return <ShieldAlertIcon className="size-4" />;
    case 1:
      return <SwordsIcon className="size-4" />;
    case 2:
      return <ZapIcon className="size-4" />;
    default:
      return <LightbulbIcon className="size-4" />;
  }
};

const getTipStyle = (index: number) => {
  switch (index) {
    case 0:
      return {
        bg: "bg-danger-muted/50",
        border: "border-danger/20",
        icon: "text-danger-muted-foreground",
      };
    case 1:
      return {
        bg: "bg-warning-muted/50",
        border: "border-warning/20",
        icon: "text-warning-muted-foreground",
      };
    case 2:
      return {
        bg: "bg-info-muted/50",
        border: "border-info/20",
        icon: "text-info-muted-foreground",
      };
    default:
      return {
        bg: "bg-muted/50",
        border: "border-border",
        icon: "text-muted-foreground",
      };
  }
};

export const CounterPickTips = ({ championName, tips }: CounterPickTipsProps) => (
  <Card className="border-border/50">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        <LightbulbIcon className="size-5 text-warning-muted-foreground" />
        Conseils stratégiques
      </CardTitle>
      <CardDescription>
        Comment aborder les matchups contre {championName}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid gap-3 md:grid-cols-3">
        {tips.map((tip, index) => {
          const style = getTipStyle(index);
          return (
            <div
              key={index}
              className={cn(
                "rounded-xl border p-4 transition-colors",
                style.bg,
                style.border
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <div className={cn("rounded-lg bg-background/80 p-1.5", style.icon)}>
                  {getTipIcon(index)}
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {index === 0
                    ? "Priorité"
                    : index === 1
                    ? "En jeu"
                    : "Vision"}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">{tip}</p>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);
