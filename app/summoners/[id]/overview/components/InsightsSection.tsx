"use client";

import { AIInsight, AIInsightCard } from "@/components/AIInsightCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface InsightsSectionProps {
  insights: AIInsight[];
}

export const InsightsSection = ({ insights }: InsightsSectionProps) => {
  if (insights.length === 0) return null;

  return (
    <Card className="border-border/70 bg-background/90 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Insights IA
        </CardTitle>
        <CardDescription className="text-xs">
          Recommandations générées automatiquement à partir de vos derniers matchs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => (
          <AIInsightCard
            key={`${insight.title}-${index}`}
            insight={insight}
            size="compact"
          />
        ))}
      </CardContent>
    </Card>
  );
};
