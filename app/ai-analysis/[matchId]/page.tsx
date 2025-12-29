"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2Icon,
  BrainIcon,
  TargetIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  ArrowLeftIcon,
  SparklesIcon,
  RefreshCwIcon,
  ZapIcon,
  ShieldIcon,
  SwordsIcon,
} from "lucide-react";
import { ChampionIcon } from "@/components/ChampionIcon";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { useAIAnalysis } from "@/lib/hooks/use-ai-analysis";
import { useChampions } from "@/lib/hooks/use-champions";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

// Score circle component
const ScoreCircle = ({ score, size = 120 }: { score: number; size?: number }) => {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const strokeDashoffset = circumference - progress;

  const getScoreColor = (s: number) => {
    if (s >= 80) return { stroke: "#22c55e", text: "text-green-500" };
    if (s >= 60) return { stroke: "#eab308", text: "text-yellow-500" };
    return { stroke: "#ef4444", text: "text-red-500" };
  };

  const colors = getScoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-muted/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.stroke}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold", colors.text)}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
};

// Insight card component
const InsightCard = ({
  title,
  description,
  category,
  type,
}: {
  title: string;
  description: string;
  category: string;
  type: "strength" | "weakness" | "tip";
}) => {
  const config = {
    strength: {
      icon: CheckCircleIcon,
      iconColor: "text-green-500",
      bg: "bg-green-500/5",
      border: "border-green-500/20 hover:border-green-500/40",
    },
    weakness: {
      icon: AlertTriangleIcon,
      iconColor: "text-red-500",
      bg: "bg-red-500/5",
      border: "border-red-500/20 hover:border-red-500/40",
    },
    tip: {
      icon: SparklesIcon,
      iconColor: "text-blue-500",
      bg: "bg-blue-500/5",
      border: "border-blue-500/20 hover:border-blue-500/40",
    },
  };

  const { icon: Icon, iconColor, bg, border } = config[type];

  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-all duration-200",
        bg,
        border
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5", iconColor)}>
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-semibold text-sm">{title}</h4>
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {category}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function AIAnalysisPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const { user } = useAuth();
  const matchId = params.matchId as string;
  const participantPuuid = searchParams.get("puuid") || user?.riotPuuid || "";

  const {
    canAnalyze,
    isAnalyzing,
    remainingAnalyses,
    analysis,
    error,
    analyzeMatch,
  } = useAIAnalysis();
  const { championKeyToIdMap } = useChampions();

  const [hasStartedAnalysis, setHasStartedAnalysis] = useState(false);

  useEffect(() => {
    if (matchId && participantPuuid && canAnalyze && !hasStartedAnalysis && !analysis) {
      setHasStartedAnalysis(true);
      analyzeMatch(matchId, participantPuuid);
    }
  }, [matchId, participantPuuid, canAnalyze, hasStartedAnalysis, analysis, analyzeMatch]);

  const handleRetryAnalysis = () => {
    if (matchId && participantPuuid) {
      analyzeMatch(matchId, participantPuuid);
    }
  };

  const getPerformanceLabel = (performance: string) => {
    switch (performance) {
      case "excellent": return { label: "Excellent", color: "bg-green-500" };
      case "good": return { label: "Bon", color: "bg-blue-500" };
      case "average": return { label: "Moyen", color: "bg-yellow-500" };
      case "poor": return { label: "Faible", color: "bg-red-500" };
      default: return { label: performance, color: "bg-muted" };
    }
  };

  // Loading state
  if (isAnalyzing) {
    return (
      <div className="container mx-auto py-20">
        <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-full p-8 border border-primary/20">
              <BrainIcon className="size-12 text-primary animate-pulse" />
            </div>
          </div>
          <Loader2Icon className="size-6 animate-spin text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Analyse en cours...</h3>
          <p className="text-muted-foreground text-sm">
            Notre IA analyse votre match en profondeur
          </p>
        </div>
      </div>
    );
  }

  // Error or limit reached
  if (error || (!canAnalyze && !analysis)) {
    return (
      <div className="container mx-auto py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-yellow-500/10 rounded-full p-6 w-fit mx-auto mb-6">
            <AlertTriangleIcon className="size-12 text-yellow-500" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">
            {!canAnalyze ? "Limite d'analyses atteinte" : "Erreur lors de l'analyse"}
          </h3>
          <p className="text-muted-foreground mb-8">
            {!canAnalyze
              ? "Vous avez utilisé toutes vos analyses gratuites aujourd'hui."
              : error || "Une erreur s'est produite lors de l'analyse du match."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {canAnalyze && (
              <Button onClick={handleRetryAnalysis}>
                <RefreshCwIcon className="mr-2 size-4" />
                Réessayer
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/summoners">Retour au profil</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No PUUID
  if (!participantPuuid) {
    return (
      <div className="container mx-auto py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-muted rounded-full p-6 w-fit mx-auto mb-6">
            <AlertTriangleIcon className="size-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-3">
            Impossible d&apos;identifier le joueur
          </h3>
          <p className="text-muted-foreground mb-6">
            Veuillez lier votre compte Riot ou spécifier le joueur à analyser.
          </p>
          <Button variant="outline" asChild>
            <Link href="/settings">Lier mon compte Riot</Link>
          </Button>
        </div>
      </div>
    );
  }

  // No analysis yet
  if (!analysis) {
    return (
      <div className="container mx-auto py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-primary/10 rounded-full p-6 w-fit mx-auto mb-6">
            <BrainIcon className="size-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-3">Prêt à analyser</h3>
          <p className="text-muted-foreground mb-6">
            Lancez l&apos;analyse pour obtenir des insights personnalisés.
          </p>
          <Button size="lg" onClick={handleRetryAnalysis} disabled={!canAnalyze}>
            <SparklesIcon className="mr-2 size-4" />
            Lancer l&apos;analyse
          </Button>
        </div>
      </div>
    );
  }

  const performanceConfig = getPerformanceLabel(analysis.championPerformance.performance);

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/summoners">
              <ArrowLeftIcon className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Analyse IA</h1>
            <p className="text-sm text-muted-foreground">
              Insights personnalisés
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {remainingAnalyses !== Infinity && (
            <Badge variant="outline" className="text-xs">
              {remainingAnalyses} restantes
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1.5">
            <BrainIcon className="size-3" />
            IA
          </Badge>
        </div>
      </div>

      {/* Hero Section - Score + Champion */}
      <div className="grid md:grid-cols-[1fr,auto] gap-6 mb-8">
        {/* Score Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <ScoreCircle score={analysis.overall.score} />
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">Score Global</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {analysis.overall.summary}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Champion Card */}
        <Card className="md:w-72">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <ChampionIcon
                  championId={analysis.championPerformance.championId}
                  championKey={analysis.championPerformance.championId}
                  championKeyToId={championKeyToIdMap}
                  alt={analysis.championPerformance.championName}
                  size={56}
                  shape="rounded"
                  className="border-2 border-border"
                />
              </div>
              <div>
                <Badge className={cn("text-white mb-1", performanceConfig.color)}>
                  {performanceConfig.label}
                </Badge>
                <h3 className="font-semibold">
                  {analysis.championPerformance.championName}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Champion Details */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircleIcon className="size-4 text-green-500" />
                <h4 className="font-semibold text-sm">Points forts</h4>
              </div>
              <ul className="space-y-2">
                {analysis.championPerformance.reasons.map((reason, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggestions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUpIcon className="size-4 text-blue-500" />
                <h4 className="font-semibold text-sm">Axes d&apos;amélioration</h4>
              </div>
              <ul className="space-y-2">
                {analysis.championPerformance.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Strengths */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-green-500/10">
              <ShieldIcon className="size-4 text-green-500" />
            </div>
            <h3 className="font-semibold">Points Forts</h3>
            <Badge variant="secondary" className="ml-auto text-xs">
              {analysis.strengths.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {analysis.strengths.map((strength, idx) => (
              <InsightCard
                key={idx}
                title={strength.title}
                description={strength.description}
                category={strength.category}
                type="strength"
              />
            ))}
          </div>
        </div>

        {/* Weaknesses */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-red-500/10">
              <TargetIcon className="size-4 text-red-500" />
            </div>
            <h3 className="font-semibold">À Améliorer</h3>
            <Badge variant="secondary" className="ml-auto text-xs">
              {analysis.weaknesses.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {analysis.weaknesses.map((weakness, idx) => (
              <InsightCard
                key={idx}
                title={weakness.title}
                description={weakness.description}
                category={weakness.category}
                type="weakness"
              />
            ))}
          </div>
        </div>

        {/* Tips */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <ZapIcon className="size-4 text-blue-500" />
            </div>
            <h3 className="font-semibold">Conseils</h3>
            <Badge variant="secondary" className="ml-auto text-xs">
              {analysis.tips.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {analysis.tips.map((tip, idx) => (
              <InsightCard
                key={idx}
                title={tip.title}
                description={tip.description}
                category={tip.category}
                type="tip"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Key Moments Timeline */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <SwordsIcon className="size-4 text-primary" />
            </div>
            <h3 className="font-semibold">Moments Clés</h3>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {analysis.keyMoments.map((moment, idx) => {
                const isPositive = moment.impact === "Positif";
                return (
                  <div key={idx} className="relative pl-12">
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        "absolute left-2 top-1 size-5 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white",
                        isPositive ? "bg-green-500" : "bg-red-500"
                      )}
                    >
                      {idx + 1}
                    </div>

                    <div
                      className={cn(
                        "p-4 rounded-xl border",
                        isPositive
                          ? "bg-green-500/5 border-green-500/20"
                          : "bg-red-500/5 border-red-500/20"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{moment.event}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {moment.timestamp}
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs",
                            isPositive ? "text-green-600" : "text-red-600"
                          )}
                        >
                          {moment.impact}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {moment.decision}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
