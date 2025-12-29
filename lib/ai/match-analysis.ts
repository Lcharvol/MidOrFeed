import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger("ai-analysis");

// Types pour l'analyse
export interface MatchAnalysisInput {
  matchId: string;
  participantPuuid: string;
}

export interface AIInsight {
  type: "strength" | "weakness" | "tip";
  category: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  data?: Record<string, unknown>;
}

export interface KeyMoment {
  timestamp: string;
  event: string;
  impact: "Positif" | "Négatif";
  decision: string;
}

export interface ChampionPerformance {
  championId: string;
  championName: string;
  performance: "excellent" | "good" | "average" | "poor";
  reasons: string[];
  suggestions: string[];
}

export interface MatchAnalysisResult {
  overall: {
    score: number;
    summary: string;
  };
  strengths: AIInsight[];
  weaknesses: AIInsight[];
  tips: AIInsight[];
  keyMoments: KeyMoment[];
  championPerformance: ChampionPerformance;
}

// Récupérer les données du match depuis la base de données
async function getMatchData(matchId: string, participantPuuid: string) {
  const match = await prisma.match.findUnique({
    where: { matchId },
    include: {
      participants: true,
    },
  });

  if (!match) {
    throw new Error(`Match ${matchId} non trouvé`);
  }

  // Trouver le participant spécifique
  const participant = match.participants.find(
    (p) => p.participantPUuid === participantPuuid
  );

  if (!participant) {
    throw new Error(`Participant ${participantPuuid} non trouvé dans le match`);
  }

  // Récupérer les infos du champion
  const champion = await prisma.champion.findFirst({
    where: { championId: participant.championId },
  });

  // Récupérer les stats globales du champion pour comparaison
  const championStats = await prisma.championStats.findFirst({
    where: { championId: participant.championId },
  });

  // Calculer les métriques du joueur
  const gameDurationMinutes = match.gameDuration / 60;
  const kda =
    participant.deaths === 0
      ? participant.kills + participant.assists
      : (participant.kills + participant.assists) / participant.deaths;
  const csPerMin = 0; // Non disponible dans le schéma actuel
  const goldPerMin = participant.goldEarned / gameDurationMinutes;
  const damagePerMin =
    participant.totalDamageDealtToChampions / gameDurationMinutes;
  const visionPerMin = participant.visionScore / gameDurationMinutes;

  // Récupérer les coéquipiers et ennemis
  const teammates = match.participants.filter(
    (p) => p.teamId === participant.teamId && p.id !== participant.id
  );
  const enemies = match.participants.filter(
    (p) => p.teamId !== participant.teamId
  );

  // Calculer les moyennes de l'équipe
  const teamStats = {
    avgKills:
      teammates.reduce((sum, p) => sum + p.kills, participant.kills) / 5,
    avgDeaths:
      teammates.reduce((sum, p) => sum + p.deaths, participant.deaths) / 5,
    avgAssists:
      teammates.reduce((sum, p) => sum + p.assists, participant.assists) / 5,
    avgGold:
      teammates.reduce((sum, p) => sum + p.goldEarned, participant.goldEarned) /
      5,
    avgDamage:
      teammates.reduce(
        (sum, p) => sum + p.totalDamageDealtToChampions,
        participant.totalDamageDealtToChampions
      ) / 5,
    avgVision:
      teammates.reduce((sum, p) => sum + p.visionScore, participant.visionScore) /
      5,
  };

  return {
    match: {
      id: match.matchId,
      duration: match.gameDuration,
      durationMinutes: gameDurationMinutes,
      gameMode: match.gameMode,
      queueId: match.queueId,
      gameVersion: match.gameVersion,
    },
    player: {
      championId: participant.championId,
      championName: champion?.name || participant.championId,
      role: participant.role || "UNKNOWN",
      lane: participant.lane || "UNKNOWN",
      kills: participant.kills,
      deaths: participant.deaths,
      assists: participant.assists,
      kda: Math.round(kda * 100) / 100,
      goldEarned: participant.goldEarned,
      goldSpent: participant.goldSpent,
      goldPerMin: Math.round(goldPerMin),
      totalDamageDealtToChampions: participant.totalDamageDealtToChampions,
      damagePerMin: Math.round(damagePerMin),
      totalDamageTaken: participant.totalDamageTaken,
      visionScore: participant.visionScore,
      visionPerMin: Math.round(visionPerMin * 10) / 10,
      win: participant.win,
      teamId: participant.teamId,
    },
    championStats: championStats
      ? {
          avgKDA: championStats.avgKDA,
          winRate: championStats.winRate,
          avgKills: championStats.avgKills,
          avgDeaths: championStats.avgDeaths,
          avgAssists: championStats.avgAssists,
          avgDamageDealt: championStats.avgDamageDealt,
          avgVisionScore: championStats.avgVisionScore,
          totalGames: championStats.totalGames,
        }
      : null,
    teamStats,
    teammates: teammates.map((t) => ({
      championId: t.championId,
      kills: t.kills,
      deaths: t.deaths,
      assists: t.assists,
      role: t.role,
    })),
    enemies: enemies.map((e) => ({
      championId: e.championId,
      kills: e.kills,
      deaths: e.deaths,
      assists: e.assists,
      role: e.role,
    })),
  };
}

// Générer l'analyse avec Claude
async function generateAnalysisWithClaude(
  matchData: Awaited<ReturnType<typeof getMatchData>>
): Promise<MatchAnalysisResult> {
  // Lire directement depuis process.env pour éviter les problèmes de cache
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicApiKey) {
    logger.warn("ANTHROPIC_API_KEY non configurée, utilisation de l'analyse basique", {
      envKeys: Object.keys(process.env).filter(k => k.includes("ANTHROPIC")),
    });
    return generateBasicAnalysis(matchData);
  }

  logger.info("Utilisation de Claude pour l'analyse", {
    matchId: matchData.match.id,
  });

  const anthropic = new Anthropic({
    apiKey: anthropicApiKey,
  });

  const prompt = `Tu es un analyste expert de League of Legends. Analyse cette performance de match et fournis des insights détaillés.

## Données du Match

**Durée:** ${Math.round(matchData.match.durationMinutes)} minutes
**Mode de jeu:** ${matchData.match.gameMode}
**Résultat:** ${matchData.player.win ? "Victoire" : "Défaite"}

## Performance du Joueur

**Champion:** ${matchData.player.championName}
**Rôle:** ${matchData.player.role} / ${matchData.player.lane}
**KDA:** ${matchData.player.kills}/${matchData.player.deaths}/${matchData.player.assists} (${matchData.player.kda})
**Or gagné:** ${matchData.player.goldEarned} (${matchData.player.goldPerMin}/min)
**Dégâts aux champions:** ${matchData.player.totalDamageDealtToChampions} (${matchData.player.damagePerMin}/min)
**Dégâts subis:** ${matchData.player.totalDamageTaken}
**Score de vision:** ${matchData.player.visionScore} (${matchData.player.visionPerMin}/min)

${
  matchData.championStats
    ? `## Statistiques moyennes pour ${matchData.player.championName}
**KDA moyen:** ${matchData.championStats.avgKDA}
**Win rate global:** ${matchData.championStats.winRate}%
**Kills moyens:** ${matchData.championStats.avgKills}
**Deaths moyens:** ${matchData.championStats.avgDeaths}
**Assists moyens:** ${matchData.championStats.avgAssists}
**Basé sur:** ${matchData.championStats.totalGames} parties`
    : ""
}

## Statistiques de l'équipe (moyennes)
**Kills:** ${matchData.teamStats.avgKills.toFixed(1)}
**Deaths:** ${matchData.teamStats.avgDeaths.toFixed(1)}
**Assists:** ${matchData.teamStats.avgAssists.toFixed(1)}
**Or:** ${matchData.teamStats.avgGold.toFixed(0)}
**Dégâts:** ${matchData.teamStats.avgDamage.toFixed(0)}
**Vision:** ${matchData.teamStats.avgVision.toFixed(1)}

## Coéquipiers
${matchData.teammates.map((t) => `- ${t.championId}: ${t.kills}/${t.deaths}/${t.assists}`).join("\n")}

## Ennemis
${matchData.enemies.map((e) => `- ${e.championId}: ${e.kills}/${e.deaths}/${e.assists}`).join("\n")}

---

Génère une analyse JSON avec ce format exact:
{
  "overall": {
    "score": <nombre 0-100 représentant la performance globale>,
    "summary": "<résumé en 2-3 phrases de la performance>"
  },
  "strengths": [
    {
      "type": "strength",
      "category": "<Vision|Combat|Farm|Objectifs|Macro|Positionnement>",
      "title": "<titre court>",
      "description": "<description détaillée>",
      "impact": "<high|medium|low>",
      "data": {}
    }
  ],
  "weaknesses": [
    {
      "type": "weakness",
      "category": "<catégorie>",
      "title": "<titre court>",
      "description": "<description détaillée>",
      "impact": "<high|medium|low>",
      "data": {}
    }
  ],
  "tips": [
    {
      "type": "tip",
      "category": "<catégorie>",
      "title": "<conseil actionnable>",
      "description": "<explication détaillée>",
      "impact": "<high|medium|low>"
    }
  ],
  "keyMoments": [
    {
      "timestamp": "<XX:XX format>",
      "event": "<nom de l'événement>",
      "impact": "<Positif|Négatif>",
      "decision": "<analyse de la décision>"
    }
  ],
  "championPerformance": {
    "championId": "${matchData.player.championId}",
    "championName": "${matchData.player.championName}",
    "performance": "<excellent|good|average|poor>",
    "reasons": ["<raison 1>", "<raison 2>"],
    "suggestions": ["<suggestion 1>", "<suggestion 2>"]
  }
}

Analyse la performance objectivement:
- Compare aux moyennes du champion si disponibles
- Compare à la moyenne de l'équipe
- Identifie 2-3 points forts et 2-3 points faibles
- Donne 2-3 conseils pratiques
- Invente 2-3 moments clés basés sur les statistiques (early, mid, late game)
- Évalue la performance sur le champion spécifique

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extraire le texte de la réponse
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parser le JSON
    const analysis = JSON.parse(responseText) as MatchAnalysisResult;

    logger.info("Analyse Claude générée avec succès", {
      matchId: matchData.match.id,
      score: analysis.overall.score,
    });

    return analysis;
  } catch (error) {
    logger.error("Erreur lors de l'analyse Claude", error as Error);
    // Fallback sur l'analyse basique
    return generateBasicAnalysis(matchData);
  }
}

// Analyse basique sans Claude (fallback)
function generateBasicAnalysis(
  matchData: Awaited<ReturnType<typeof getMatchData>>
): MatchAnalysisResult {
  const player = matchData.player;
  const champStats = matchData.championStats;
  const teamStats = matchData.teamStats;

  // Calculer un score basé sur les métriques
  let score = 50;

  // Bonus/malus pour KDA
  if (player.kda >= 5) score += 15;
  else if (player.kda >= 3) score += 10;
  else if (player.kda >= 2) score += 5;
  else if (player.kda < 1) score -= 10;

  // Bonus pour victoire
  if (player.win) score += 10;

  // Comparaison aux moyennes du champion
  if (champStats) {
    if (player.kda > champStats.avgKDA) score += 5;
    if (player.kills > champStats.avgKills) score += 3;
    if (player.deaths < champStats.avgDeaths) score += 3;
  }

  // Comparaison à l'équipe
  if (player.kills > teamStats.avgKills) score += 3;
  if (player.totalDamageDealtToChampions > teamStats.avgDamage) score += 5;
  if (player.visionScore > teamStats.avgVision) score += 3;

  score = Math.min(100, Math.max(0, score));

  // Générer les insights
  const strengths: AIInsight[] = [];
  const weaknesses: AIInsight[] = [];
  const tips: AIInsight[] = [];

  // Analyse du KDA
  if (player.kda >= 3) {
    strengths.push({
      type: "strength",
      category: "Combat",
      title: "Excellent ratio KDA",
      description: `Votre KDA de ${player.kda} montre une bonne gestion des combats et une capacité à rester en vie tout en contribuant aux kills.`,
      impact: player.kda >= 5 ? "high" : "medium",
      data: { kda: player.kda },
    });
  } else if (player.kda < 1.5) {
    weaknesses.push({
      type: "weakness",
      category: "Combat",
      title: "KDA à améliorer",
      description: `Votre KDA de ${player.kda} indique des difficultés en combat. Essayez de mieux évaluer les situations avant d'engager.`,
      impact: "high",
      data: { kda: player.kda },
    });
  }

  // Analyse de la vision
  if (player.visionPerMin >= 1.5) {
    strengths.push({
      type: "strength",
      category: "Vision",
      title: "Bon contrôle de vision",
      description: `Avec ${player.visionScore} de score de vision (${player.visionPerMin}/min), vous contribuez bien au contrôle de la map.`,
      impact: "medium",
      data: { visionScore: player.visionScore, visionPerMin: player.visionPerMin },
    });
  } else if (player.visionPerMin < 0.8) {
    weaknesses.push({
      type: "weakness",
      category: "Vision",
      title: "Vision insuffisante",
      description: `Votre score de vision de ${player.visionScore} (${player.visionPerMin}/min) est bas. Pensez à placer plus de wards.`,
      impact: "medium",
      data: { visionScore: player.visionScore },
    });
    tips.push({
      type: "tip",
      category: "Vision",
      title: "Améliorez votre vision",
      description:
        "Achetez des Control Wards et placez-les dans des zones stratégiques. Utilisez votre trinket dès qu'il est disponible.",
      impact: "medium",
    });
  }

  // Analyse des dégâts
  if (player.totalDamageDealtToChampions > teamStats.avgDamage * 1.3) {
    strengths.push({
      type: "strength",
      category: "Dégâts",
      title: "Contribution majeure aux dégâts",
      description: `Vous avez infligé ${player.totalDamageDealtToChampions} dégâts, soit 30% de plus que la moyenne de votre équipe.`,
      impact: "high",
      data: { damage: player.totalDamageDealtToChampions },
    });
  } else if (player.totalDamageDealtToChampions < teamStats.avgDamage * 0.7) {
    weaknesses.push({
      type: "weakness",
      category: "Dégâts",
      title: "Dégâts inférieurs à l'équipe",
      description: `Vos ${player.totalDamageDealtToChampions} dégâts sont en dessous de la moyenne de l'équipe. Cherchez plus d'opportunités d'engager.`,
      impact: "medium",
      data: { damage: player.totalDamageDealtToChampions },
    });
  }

  // Conseils généraux
  if (player.deaths > 5) {
    tips.push({
      type: "tip",
      category: "Survie",
      title: "Réduisez vos morts",
      description: `Avec ${player.deaths} morts, essayez de jouer plus safe dans les moments critiques. Évaluez mieux les risques avant d'engager.`,
      impact: "high",
    });
  }

  if (!player.win) {
    tips.push({
      type: "tip",
      category: "Macro",
      title: "Focus sur les objectifs",
      description:
        "Même avec de bonnes statistiques individuelles, les objectifs gagnent les parties. Priorisez Herald, Dragon et Baron.",
      impact: "high",
    });
  }

  // Moments clés simulés
  const keyMoments: KeyMoment[] = [
    {
      timestamp: "05:00",
      event: "Early Game",
      impact: player.kills >= 2 || player.assists >= 2 ? "Positif" : "Négatif",
      decision:
        player.kills >= 2
          ? "Bon départ avec des kills early, pression établie."
          : "Départ difficile, l'adversaire a pris l'avantage.",
    },
    {
      timestamp: "15:00",
      event: "Mid Game",
      impact: player.goldEarned > teamStats.avgGold ? "Positif" : "Négatif",
      decision:
        player.goldEarned > teamStats.avgGold
          ? "Bonne gestion de l'or et participation aux objectifs."
          : "Retard en or par rapport à l'équipe.",
    },
    {
      timestamp: `${Math.round(matchData.match.durationMinutes)}:00`,
      event: "Late Game",
      impact: player.win ? "Positif" : "Négatif",
      decision: player.win
        ? "Bonne exécution en fin de partie, victoire sécurisée."
        : "Malgré les efforts, l'équipe n'a pas pu conclure.",
    },
  ];

  // Performance du champion
  let performance: "excellent" | "good" | "average" | "poor";
  if (score >= 80) performance = "excellent";
  else if (score >= 60) performance = "good";
  else if (score >= 40) performance = "average";
  else performance = "poor";

  return {
    overall: {
      score,
      summary: player.win
        ? `Victoire avec un KDA de ${player.kda} sur ${player.championName}. ${
            score >= 70
              ? "Performance solide avec une bonne contribution à l'équipe."
              : "Des axes d'amélioration existent malgré la victoire."
          }`
        : `Défaite avec un KDA de ${player.kda} sur ${player.championName}. ${
            score >= 50
              ? "Malgré une performance correcte, l'équipe n'a pas pu l'emporter."
              : "Plusieurs aspects de votre jeu peuvent être améliorés."
          }`,
    },
    strengths:
      strengths.length > 0
        ? strengths
        : [
            {
              type: "strength",
              category: "Général",
              title: "Participation au match",
              description:
                "Vous avez participé activement au match et contribué aux efforts de l'équipe.",
              impact: "medium",
            },
          ],
    weaknesses:
      weaknesses.length > 0
        ? weaknesses
        : [
            {
              type: "weakness",
              category: "Général",
              title: "Analyse limitée",
              description:
                "Les données disponibles ne permettent pas d'identifier de faiblesses majeures.",
              impact: "low",
            },
          ],
    tips:
      tips.length > 0
        ? tips
        : [
            {
              type: "tip",
              category: "Général",
              title: "Continuez à progresser",
              description:
                "Analysez vos replays pour identifier des opportunités d'amélioration spécifiques.",
              impact: "medium",
            },
          ],
    keyMoments,
    championPerformance: {
      championId: player.championId,
      championName: player.championName,
      performance,
      reasons:
        score >= 60
          ? [
              "Bonne gestion des ressources",
              "Contribution positive à l'équipe",
            ]
          : ["Des difficultés ont été rencontrées", "Axes d'amélioration identifiés"],
      suggestions: [
        `Continuez à pratiquer ${player.championName}`,
        "Travaillez sur votre positionnement en combat",
        "Améliorez votre contrôle de vision",
      ],
    },
  };
}

// Fonction principale d'analyse
export async function analyzeMatch(
  input: MatchAnalysisInput
): Promise<MatchAnalysisResult> {
  logger.info("Démarrage de l'analyse de match", {
    matchId: input.matchId,
    participantPuuid: input.participantPuuid,
  });

  // Récupérer les données du match
  const matchData = await getMatchData(input.matchId, input.participantPuuid);

  // Générer l'analyse
  const analysis = await generateAnalysisWithClaude(matchData);

  return analysis;
}

// Incrémenter le compteur d'analyses quotidiennes
export async function incrementDailyAnalysisCount(userId: string): Promise<{
  success: boolean;
  remaining: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      dailyAnalysesUsed: true,
      lastDailyReset: true,
      subscriptionTier: true,
      subscriptionExpiresAt: true,
    },
  });

  if (!user) {
    throw new Error("Utilisateur non trouvé");
  }

  // Vérifier si premium
  const isPremium =
    user.subscriptionTier === "premium" &&
    user.subscriptionExpiresAt &&
    new Date(user.subscriptionExpiresAt) > new Date();

  if (isPremium) {
    return { success: true, remaining: Infinity };
  }

  // Vérifier si c'est un nouveau jour
  const now = new Date();
  const lastReset = new Date(user.lastDailyReset);
  const isNewDay =
    now.getDate() !== lastReset.getDate() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear();

  let newCount: number;

  if (isNewDay) {
    // Réinitialiser le compteur
    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyAnalysesUsed: 1,
        lastDailyReset: now,
      },
    });
    newCount = 1;
  } else {
    // Incrémenter le compteur
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        dailyAnalysesUsed: { increment: 1 },
      },
    });
    newCount = updated.dailyAnalysesUsed;
  }

  const FREE_LIMIT = 3;
  return {
    success: newCount <= FREE_LIMIT,
    remaining: Math.max(0, FREE_LIMIT - newCount),
  };
}

// Vérifier si l'utilisateur peut analyser
export async function canUserAnalyze(userId: string): Promise<{
  canAnalyze: boolean;
  remaining: number;
  isPremium: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      dailyAnalysesUsed: true,
      lastDailyReset: true,
      subscriptionTier: true,
      subscriptionExpiresAt: true,
    },
  });

  if (!user) {
    return { canAnalyze: false, remaining: 0, isPremium: false };
  }

  // Vérifier si premium
  const isPremium =
    user.subscriptionTier === "premium" &&
    user.subscriptionExpiresAt &&
    new Date(user.subscriptionExpiresAt) > new Date();

  if (isPremium) {
    return { canAnalyze: true, remaining: Infinity, isPremium: true };
  }

  // Vérifier si c'est un nouveau jour
  const now = new Date();
  const lastReset = new Date(user.lastDailyReset);
  const isNewDay =
    now.getDate() !== lastReset.getDate() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear();

  const FREE_LIMIT = 3;
  const used = isNewDay ? 0 : user.dailyAnalysesUsed;
  const remaining = Math.max(0, FREE_LIMIT - used);

  return {
    canAnalyze: remaining > 0,
    remaining,
    isPremium: false,
  };
}
