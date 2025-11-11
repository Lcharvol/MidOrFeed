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
    <Card className="border-border/80 bg-background/95 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Insights IA
        </CardTitle>
        <CardDescription>
          Recommandations générées automatiquement à partir de vos derniers matchs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
