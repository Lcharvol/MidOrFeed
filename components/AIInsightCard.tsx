"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BrainIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  AlertCircleIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

export interface AIInsight {
  type: "positive" | "negative" | "neutral" | "warning";
  title: string;
  description: string;
  confidence?: number; // 0-100
  recommendation?: string;
  data?: Record<string, string | number>;
}

interface AIInsightCardProps {
  insight: AIInsight;
  className?: string;
  size?: "default" | "compact";
}

export function AIInsightCard({
  insight,
  className,
  size = "default",
}: AIInsightCardProps) {
  const { t } = useI18n();

  const getTypeConfig = () => {
    switch (insight.type) {
      case "positive":
        return {
          icon: TrendingUpIcon,
          bgGradient: "from-primary/20 via-primary/10 to-primary/20",
          borderColor: "border-primary",
          iconColor: "text-primary",
          shimmerColor: "from-primary/30",
          glowColor: "shadow-primary/50",
          badge: "positive",
        };
      case "negative":
        return {
          icon: TrendingDownIcon,
          bgGradient:
            "from-destructive/20 via-destructive/10 to-destructive/20",
          borderColor: "border-destructive",
          iconColor: "text-destructive",
          shimmerColor: "from-destructive/30",
          glowColor: "shadow-destructive/50",
          badge: "negative",
        };
      case "warning":
        return {
          icon: AlertCircleIcon,
          bgGradient: "from-amber-500/20 via-amber-500/10 to-amber-500/20",
          borderColor: "border-amber-500",
          iconColor: "text-amber-500",
          shimmerColor: "from-amber-500/30",
          glowColor: "shadow-amber-500/50",
          badge: "warning",
        };
      default:
        return {
          icon: BrainIcon,
          bgGradient: "from-primary/20 via-primary/10 to-primary/20",
          borderColor: "border-primary",
          iconColor: "text-primary",
          shimmerColor: "from-primary/30",
          glowColor: "shadow-primary/50",
          badge: "neutral",
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  const getBadgeText = () => {
    switch (config.badge) {
      case "positive":
        return t("aiInsight.positive");
      case "negative":
        return t("aiInsight.negative");
      case "warning":
        return t("aiInsight.warning");
      default:
        return t("aiInsight.analysis");
    }
  };

  if (size === "compact") {
    return (
      <Card
        className={`relative overflow-hidden border-2 ${config.borderColor} ${className}`}
      >
        {/* Shimmer overlay */}
        <div className="absolute inset-0 -z-10">
          <div
            className={`absolute inset-0 bg-gradient-to-r ${config.shimmerColor} opacity-0 animate-shimmer`}
            style={{ width: "200%" }}
          />
        </div>
        <div
          className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient}`}
        />
        <CardContent className="relative p-4">
          <div className="flex items-start gap-3">
            <div
              className={`rounded-lg bg-gradient-to-br ${config.bgGradient} p-2 animate-pulse-glow`}
            >
              <Icon className={`size-5 ${config.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="outline"
                  className="text-xs bg-gradient-to-br from-violet-500 to-purple-600 text-white border-violet-400"
                >
                  AI
                </Badge>
                <Badge
                  variant={
                    insight.type === "positive" ? "default" : "secondary"
                  }
                  className="text-xs"
                >
                  {getBadgeText()}
                </Badge>
                {insight.confidence !== undefined && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {insight.confidence}%
                  </span>
                )}
              </div>
              <p className="font-semibold text-sm mb-1">{insight.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {insight.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`relative overflow-hidden border-2 ${config.borderColor} ${className}`}
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -z-10">
        <div
          className={`absolute inset-0 bg-gradient-to-r ${config.shimmerColor} opacity-0 animate-shimmer`}
          style={{ width: "200%" }}
        />
      </div>

      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient}`}
      />

      <CardHeader className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`rounded-lg bg-gradient-to-br ${config.bgGradient} p-2 animate-pulse-glow`}
            >
              <Icon className={`size-5 ${config.iconColor}`} />
            </div>
            <CardTitle className="text-lg bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
              Analyse IA
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-violet-400"
            >
              AI
            </Badge>
            <Badge
              variant={insight.type === "positive" ? "default" : "secondary"}
            >
              {getBadgeText()}
            </Badge>
            {insight.confidence !== undefined && (
              <span className="text-sm font-medium text-muted-foreground">
                Confiance: {insight.confidence}%
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <div>
          <h4 className="font-semibold text-lg mb-2">{insight.title}</h4>
          <p className="text-muted-foreground">{insight.description}</p>
        </div>

        {insight.recommendation && (
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
            <p className="text-sm font-medium mb-1">💡 Recommandation</p>
            <p className="text-sm text-muted-foreground">
              {insight.recommendation}
            </p>
          </div>
        )}

        {insight.data && Object.keys(insight.data).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(insight.data).map(([key, value]) => (
              <Badge key={key} variant="outline">
                {key}: {String(value)}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
