"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2Icon,
  BrainIcon,
  TrophyIcon,
  TargetIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  ArrowLeftIcon,
  SparklesIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useAIAnalysis } from "@/lib/hooks/use-ai-analysis";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const getChampionImageUrl = (
  championId: string,
  championKeyToId?: Map<string, string>
): string => {
  const version = "15.21.1";
  // Accept numeric champion key or string slug
  const slug = /^\d+$/.test(String(championId))
    ? championKeyToId?.get(String(championId)) || String(championId)
    : String(championId);
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${slug}.png`;
};

interface AIInsight {
  type: "strength" | "weakness" | "tip";
  category: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  data?: any;
}

interface AIAnalysis {
  overall: {
    score: number;
    summary: string;
  };
  strengths: AIInsight[];
  weaknesses: AIInsight[];
  tips: AIInsight[];
  keyMoments: Array<{
    timestamp: string;
    event: string;
    impact: string;
    decision: string;
  }>;
  championPerformance: {
    championId: string;
    performance: "excellent" | "good" | "average" | "poor";
    reasons: string[];
    suggestions: string[];
  };
}

export default function AIAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const matchId = params.matchId as string;
  const { canAnalyze, remainingAnalyses } = useAIAnalysis();
  const { data: championsData } = useSWR("/api/champions/list", fetcher);
  const championKeyToId = useMemo(() => {
    const map = new Map<string, string>();
    const list =
      (championsData?.data as Array<{
        championKey?: number;
        championId: string;
      }>) || [];
    for (const c of list) {
      if (typeof c.championKey === "number")
        map.set(String(c.championKey), c.championId);
    }
    return map;
  }, [championsData]);

  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Simuler une analyse IA avec de fausses données
  useEffect(() => {
    if (!canAnalyze) {
      setIsLoading(false);
      return;
    }

    const generateMockAnalysis = async () => {
      setIsLoading(true);
      // Simuler un délai d'analyse
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockAnalysis: AIAnalysis = {
        overall: {
          score: 72,
          summary:
            "Performance solide avec de bonnes décisions macro, mais quelques erreurs de mécaniques ont coûté des opportunités. Focus sur les réactions en combat serait bénéfique.",
        },
        strengths: [
          {
            type: "strength",
            category: "Vision",
            title: "Excellent vision score",
            description:
              "Vous avez placé 45 wards et détruit 12 wards ennemies, ce qui a donné un net avantage à votre équipe.",
            impact: "high",
            data: { visionScore: 45, wardsCleared: 12 },
          },
          {
            type: "strength",
            category: "Objectifs",
            title: "Gestion des objectifs",
            description:
              "Votre participation aux dragons et Barons a été cruciale pour sécuriser la victoire.",
            impact: "high",
            data: { dragonParticipation: "80%", baronParticipation: "100%" },
          },
        ],
        weaknesses: [
          {
            type: "weakness",
            category: "Positionnement",
            title: "Mauvais positionnement en combat",
            description:
              "Vous avez été attrapé 8 fois en combat d'équipe, ce qui a donné l'avantage à l'ennemi.",
            impact: "high",
            data: { deathsFromPositioning: 8 },
          },
          {
            type: "weakness",
            category: "Farm",
            title: "CS sous-optimal",
            description:
              "Votre CS/min de 5.2 est en dessous de la moyenne attendue pour ce rang et ce champion.",
            impact: "medium",
            data: { csPerMin: 5.2, expectedCsPerMin: 6.8 },
          },
        ],
        tips: [
          {
            type: "tip",
            category: "Tactique",
            title: "Focus early game",
            description:
              "Votre champion excelle en early game. Essayez de forcer plus de skirmishes avant le niveau 6.",
            impact: "high",
          },
          {
            type: "tip",
            category: "Build",
            title: "Adaptation de build",
            description:
              "Contre cette composition ennemie, un build plus défensif aurait été plus efficace.",
            impact: "medium",
          },
        ],
        keyMoments: [
          {
            timestamp: "03:42",
            event: "First blood",
            impact: "Positif",
            decision:
              "Bonne rotation après avoir poussé votre vague, la pression sur la map était excellente.",
          },
          {
            timestamp: "15:23",
            event: "Dragon steal raté",
            impact: "Négatif",
            decision:
              "Timing un peu tardif sur le smite. Essayez de compter les dégâts du dragon pour un timing plus précis.",
          },
          {
            timestamp: "28:45",
            event: "Flash utilisé",
            impact: "Négatif",
            decision:
              "Utilisation du flash pour rejoindre un combat déjà perdu. Il aurait pu être sauvegardé pour un moment plus crucial.",
          },
        ],
        championPerformance: {
          championId: "Yasuo",
          performance: "good",
          reasons: [
            "Bonne gestion de la vague et trades efficaces",
            "Farm constant tout au long de la partie",
            "Engagements bien exécutés en combat d'équipe",
          ],
          suggestions: [
            "Pratiquer les airblades et les beyblades",
            "Améliorer la gestion des minions pour plus de CS",
            "Timing des wall dashes à perfectionner",
          ],
        },
      };

      setAnalysis(mockAnalysis);
      setIsLoading(false);
    };

    generateMockAnalysis();
  }, [matchId, canAnalyze]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "strength":
        return <CheckCircleIcon className="size-5 text-green-500" />;
      case "weakness":
        return <AlertTriangleIcon className="size-5 text-red-500" />;
      case "tip":
        return <SparklesIcon className="size-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case "excellent":
        return "bg-green-500 hover:bg-green-500";
      case "good":
        return "bg-blue-500 hover:bg-blue-500";
      case "average":
        return "bg-yellow-500 hover:bg-yellow-500";
      case "poor":
        return "bg-red-500 hover:bg-red-500";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-20">
            <div className="flex flex-col items-center justify-center">
              <Loader2Icon className="size-16 animate-spin text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Analyse en cours...
              </h3>
              <p className="text-muted-foreground">
                Notre IA analyse votre match en profondeur
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysis) {
    if (!canAnalyze) {
      return (
        <div className="container mx-auto py-10">
          <Card className="border-2 border-primary/20">
            <CardContent className="py-20">
              <div className="text-center max-w-2xl mx-auto">
                <AlertTriangleIcon className="size-16 mx-auto text-primary mb-4" />
                <h3 className="text-2xl font-semibold mb-2">
                  Limite d'analyses atteinte
                </h3>
                <p className="text-muted-foreground mb-6">
                  Vous avez utilisé toutes vos analyses gratuites aujourd'hui.
                  Revenez demain ou passez à Premium pour des analyses
                  illimitées.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    {/* Premium hidden per Riot policy */}
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/summoners/matches">Retour aux matchs</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-20">
            <div className="text-center">
              <AlertTriangleIcon className="size-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Aucune analyse disponible
              </h3>
              <p className="text-muted-foreground">
                Impossible de charger l'analyse pour ce match
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/summoners/matches">
              <ArrowLeftIcon className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Analyse IA</h1>
            <p className="text-muted-foreground">
              Insights personnalisés de notre intelligence artificielle
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {remainingAnalyses !== Infinity && (
            <Badge variant="outline" className="gap-2">
              {remainingAnalyses} {t("subscription.remainingAnalyses")}
            </Badge>
          )}
          <Badge variant="secondary" className="gap-2">
            <BrainIcon className="size-3" />
            Powered by AI
          </Badge>
        </div>
      </div>

      {/* Score Global */}
      <Card className="mb-8 border-2 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">Score Global</CardTitle>
              <CardDescription>
                Évaluation complète de votre performance
              </CardDescription>
            </div>
            <div
              className={`text-6xl font-bold ${getScoreColor(
                analysis.overall.score
              )}`}
            >
              {analysis.overall.score}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-lg leading-relaxed">{analysis.overall.summary}</p>
        </CardContent>
      </Card>

      {/* Performances Champion */}
      <Card className="mb-8 border-2 border-blue-500/20">
        <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <TargetIcon className="size-5 text-blue-500" />
            Performance Champion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Image
              src={getChampionImageUrl(
                analysis.championPerformance.championId,
                championKeyToId
              )}
              alt={analysis.championPerformance.championId}
              width={80}
              height={80}
              className="rounded-lg border-2 border-blue-500/30"
            />
            <div className="flex-1 space-y-4">
              <div>
                <Badge
                  className={`${getPerformanceColor(
                    analysis.championPerformance.performance
                  )} text-white mr-2`}
                >
                  {analysis.championPerformance.performance === "excellent"
                    ? "Excellent"
                    : analysis.championPerformance.performance === "good"
                    ? "Bon"
                    : analysis.championPerformance.performance === "average"
                    ? "Moyen"
                    : "Faible"}
                </Badge>
                <h3 className="text-xl font-bold mt-2">
                  {analysis.championPerformance.championId}
                </h3>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-green-600 dark:text-green-400">
                  Points forts
                </h4>
                <ul className="space-y-1">
                  {analysis.championPerformance.reasons.map((reason, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <CheckCircleIcon className="size-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-blue-600 dark:text-blue-400">
                  Suggestions d'amélioration
                </h4>
                <ul className="space-y-1">
                  {analysis.championPerformance.suggestions.map(
                    (suggestion, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <TrendingUpIcon className="size-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        {suggestion}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Strengths */}
        <Card className="border-2 border-green-500/20">
          <CardHeader className="bg-gradient-to-r from-green-500/5 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <CheckCircleIcon className="size-5 text-green-500" />
              Points Forts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.strengths.map((strength, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border-2 border-green-500/20 bg-green-500/5 hover:border-green-500/40 transition-colors"
              >
                <div className="flex items-start gap-3 mb-2">
                  {getInsightIcon(strength.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold">{strength.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {strength.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {strength.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Weaknesses */}
        <Card className="border-2 border-red-500/20">
          <CardHeader className="bg-gradient-to-r from-red-500/5 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="size-5 text-red-500" />
              Points à Améliorer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.weaknesses.map((weakness, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border-2 border-red-500/20 bg-red-500/5 hover:border-red-500/40 transition-colors"
              >
                <div className="flex items-start gap-3 mb-2">
                  {getInsightIcon(weakness.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold">{weakness.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {weakness.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {weakness.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card className="mb-8 border-2 border-blue-500/20">
        <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="size-5 text-blue-500" />
            Conseils Personnalisés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysis.tips.map((tip, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border-2 border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                {getInsightIcon(tip.type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold">{tip.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {tip.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tip.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Key Moments */}
      <Card className="border-2 border-purple-500/20">
        <CardHeader className="bg-gradient-to-r from-purple-500/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <TrophyIcon className="size-5 text-purple-500" />
            Moments Clés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.keyMoments.map((moment, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-2 ${
                  moment.impact === "Positif"
                    ? "border-green-500/20 bg-green-500/5"
                    : "border-red-500/20 bg-red-500/5"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`size-12 rounded-full flex items-center justify-center font-bold ${
                        moment.impact === "Positif"
                          ? "bg-green-500/20 text-green-500"
                          : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground mt-1">
                      {moment.timestamp}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold">{moment.event}</h4>
                      <Badge
                        className={
                          moment.impact === "Positif"
                            ? "bg-green-500 hover:bg-green-500"
                            : "bg-red-500 hover:bg-red-500"
                        }
                      >
                        {moment.impact}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {moment.decision}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
