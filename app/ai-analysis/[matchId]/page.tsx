"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
  RefreshCwIcon,
} from "lucide-react";
import { ChampionIcon } from "@/components/ChampionIcon";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { useAIAnalysis, type MatchAnalysisResult } from "@/lib/hooks/use-ai-analysis";
import { useChampions } from "@/lib/hooks/use-champions";
import { useAuth } from "@/lib/auth-context";

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
    isPremium,
    analysis,
    error,
    analyzeMatch,
  } = useAIAnalysis();
  const { championKeyToIdMap } = useChampions();

  const [hasStartedAnalysis, setHasStartedAnalysis] = useState(false);

  // Démarrer l'analyse automatiquement au chargement
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

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "strength":
        return <CheckCircleIcon className="size-5 text-success" />;
      case "weakness":
        return <AlertTriangleIcon className="size-5 text-danger" />;
      case "tip":
        return <SparklesIcon className="size-5 text-info" />;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-danger";
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case "excellent":
        return "bg-success hover:bg-success";
      case "good":
        return "bg-info hover:bg-info";
      case "average":
        return "bg-warning hover:bg-warning";
      case "poor":
        return "bg-danger hover:bg-danger";
      default:
        return "";
    }
  };

  // État de chargement
  if (isAnalyzing) {
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
              <p className="text-sm text-muted-foreground mt-2">
                Cela peut prendre quelques secondes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Erreur ou limite atteinte
  if (error || (!canAnalyze && !analysis)) {
    return (
      <div className="container mx-auto py-10">
        <Card className="border-2 border-primary/20">
          <CardContent className="py-20">
            <div className="text-center max-w-2xl mx-auto">
              <AlertTriangleIcon className="size-16 mx-auto text-warning mb-4" />
              <h3 className="text-2xl font-semibold mb-2">
                {!canAnalyze
                  ? "Limite d'analyses atteinte"
                  : "Erreur lors de l'analyse"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {!canAnalyze
                  ? "Vous avez utilisé toutes vos analyses gratuites aujourd'hui. Revenez demain ou passez à Premium pour des analyses illimitées."
                  : error || "Une erreur s'est produite lors de l'analyse du match."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {canAnalyze && (
                  <Button size="lg" onClick={handleRetryAnalysis}>
                    <RefreshCwIcon className="mr-2 size-4" />
                    Réessayer
                  </Button>
                )}
                <Button size="lg" variant="outline" asChild>
                  <Link href="/summoners">Retour au profil</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pas de PUUID disponible
  if (!participantPuuid) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-20">
            <div className="text-center">
              <AlertTriangleIcon className="size-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Impossible d&apos;identifier le joueur
              </h3>
              <p className="text-muted-foreground mb-4">
                Veuillez lier votre compte Riot ou spécifier le joueur à analyser.
              </p>
              <Button variant="outline" asChild>
                <Link href="/settings">Lier mon compte Riot</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pas d'analyse disponible
  if (!analysis) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-20">
            <div className="text-center">
              <BrainIcon className="size-16 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Prêt à analyser
              </h3>
              <p className="text-muted-foreground mb-4">
                Cliquez sur le bouton ci-dessous pour lancer l&apos;analyse de ce match.
              </p>
              <Button size="lg" onClick={handleRetryAnalysis} disabled={!canAnalyze}>
                <SparklesIcon className="mr-2 size-4" />
                Lancer l&apos;analyse
              </Button>
              {!canAnalyze && (
                <p className="text-sm text-muted-foreground mt-4">
                  Vous avez atteint votre limite quotidienne d&apos;analyses.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affichage de l'analyse
  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/summoners">
              <ArrowLeftIcon className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold">Analyse IA</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Insights personnalisés de notre intelligence artificielle
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 ml-12 sm:ml-0">
          {remainingAnalyses !== Infinity && (
            <Badge variant="outline" className="gap-1 sm:gap-2 text-[10px] sm:text-xs">
              {remainingAnalyses} {t("subscription.remainingAnalyses")}
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1 sm:gap-2 text-[10px] sm:text-xs">
            <BrainIcon className="size-3" />
            <span className="hidden sm:inline">Powered by</span> AI
          </Badge>
        </div>
      </div>

      {/* Score Global */}
      <Card className="mb-6 sm:mb-8 border-2 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/5 to-transparent">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-2xl mb-1 sm:mb-2">Score Global</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Évaluation complète de votre performance
              </CardDescription>
            </div>
            <div
              className={`text-4xl sm:text-6xl font-bold ${getScoreColor(
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
      <Card className="mb-6 sm:mb-8 border-2 border-info/20">
        <CardHeader className="bg-gradient-to-r from-info-muted to-transparent">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <TargetIcon className="size-4 sm:size-5 text-info" />
            Performance Champion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <ChampionIcon
              championId={analysis.championPerformance.championId}
              championKey={analysis.championPerformance.championId}
              championKeyToId={championKeyToIdMap}
              alt={analysis.championPerformance.championName}
              size={64}
              shape="rounded"
              className="border-2 border-info/30 sm:size-20"
            />
            <div className="flex-1 space-y-3 sm:space-y-4">
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
                  {analysis.championPerformance.championName}
                </h3>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-success">
                  Points forts
                </h4>
                <ul className="space-y-1">
                  {analysis.championPerformance.reasons.map((reason, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <CheckCircleIcon className="size-4 text-success mt-0.5 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-info">
                  Suggestions d&apos;amélioration
                </h4>
                <ul className="space-y-1">
                  {analysis.championPerformance.suggestions.map(
                    (suggestion, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <TrendingUpIcon className="size-4 text-info mt-0.5 flex-shrink-0" />
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
        <Card className="border-2 border-success/20">
          <CardHeader className="bg-gradient-to-r from-success-muted to-transparent">
            <CardTitle className="flex items-center gap-2">
              <CheckCircleIcon className="size-5 text-success" />
              Points Forts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.strengths.map((strength, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border-2 border-success/20 bg-success-muted/50 hover:border-success/40 transition-colors"
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
        <Card className="border-2 border-danger/20">
          <CardHeader className="bg-gradient-to-r from-danger-muted to-transparent">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="size-5 text-danger" />
              Points à Améliorer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.weaknesses.map((weakness, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border-2 border-danger/20 bg-danger-muted/50 hover:border-danger/40 transition-colors"
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
      <Card className="mb-8 border-2 border-info/20">
        <CardHeader className="bg-gradient-to-r from-info-muted to-transparent">
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="size-5 text-info" />
            Conseils Personnalisés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysis.tips.map((tip, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border-2 border-info/20 bg-info-muted/50 hover:border-info/40 transition-colors"
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
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <TrophyIcon className="size-5 text-primary" />
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
                    ? "border-success/20 bg-success-muted/50"
                    : "border-danger/20 bg-danger-muted/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`size-12 rounded-full flex items-center justify-center font-bold ${
                        moment.impact === "Positif"
                          ? "bg-success/20 text-success"
                          : "bg-danger/20 text-danger"
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
                            ? "bg-success hover:bg-success"
                            : "bg-danger hover:bg-danger"
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
