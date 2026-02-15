import Anthropic from "@anthropic-ai/sdk";
import { createLogger } from "@/lib/logger";
import { toError } from "../errors";

const logger = createLogger("composition-analysis");

export interface CompositionAnalysisInput {
  championId: string;
  championName?: string;
  role: string;
  winRate: number;
  avgKDA: number;
  metrics: {
    avgDamagePerMin: number;
    avgGoldPerMin: number;
    avgVisionPerMin: number;
  };
  synergies: Array<{ championId: string; role: string; winRate: number }>;
  counters: Array<{ championId: string; winRateAgainst: number }>;
  team?: Array<{ championName: string; role: string }>;
}

export interface CompositionAnalysisResult {
  reasoning: string;
  strengths: string;
  weaknesses: string;
  playstyle: string;
}

/**
 * Generate AI-powered structured analysis for a composition suggestion.
 * Returns reasoning, strengths, weaknesses, and playstyle as separate fields.
 */
export async function generateCompositionReasoning(
  input: CompositionAnalysisInput
): Promise<CompositionAnalysisResult> {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicApiKey) {
    logger.warn("ANTHROPIC_API_KEY not configured, using basic reasoning");
    return generateBasicReasoning(input);
  }

  const anthropic = new Anthropic({
    apiKey: anthropicApiKey,
  });

  const championDisplay = input.championName || input.championId;
  const synergiesText =
    input.synergies.length > 0
      ? input.synergies
          .slice(0, 3)
          .map((s) => `- ${s.championId} (${s.role}): ${(s.winRate * 100).toFixed(1)}%`)
          .join("\n")
      : "Aucune synergie significative détectée";

  const countersText =
    input.counters.length > 0
      ? input.counters
          .slice(0, 3)
          .map((c) => `- ${c.championId}: ${(c.winRateAgainst * 100).toFixed(1)}%`)
          .join("\n")
      : "Aucun matchup favorable détecté";

  const teamText =
    input.team && input.team.length > 0
      ? input.team.map((t) => `- ${t.championName} (${t.role})`).join("\n")
      : "Équipe non définie";

  const prompt = `Tu es un expert du draft League of Legends. Analyse cette composition d'équipe et génère une analyse structurée en JSON.

Champion principal: ${championDisplay}
Rôle: ${input.role}
Win rate: ${(input.winRate * 100).toFixed(1)}%
KDA moyen: ${input.avgKDA.toFixed(2)}

Métriques (par minute):
- Dégâts: ${input.metrics.avgDamagePerMin.toFixed(0)}
- Gold: ${input.metrics.avgGoldPerMin.toFixed(0)}
- Vision: ${input.metrics.avgVisionPerMin.toFixed(1)}

Composition complète:
${teamText}

Meilleures synergies:
${synergiesText}

Efficace contre:
${countersText}

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown, sans backticks) avec ces 4 champs :
{
  "reasoning": "2-3 phrases expliquant pourquoi cette composition est recommandée, en tenant compte des synergies entre les 5 champions",
  "strengths": "2-3 points forts spécifiques à cette composition (pas juste des stats brutes)",
  "weaknesses": "2-3 faiblesses spécifiques et comment les adversaires peuvent en profiter",
  "playstyle": "Comment jouer cette composition concrètement (phases de jeu, objectifs prioritaires, style de teamfight)"
}

Utilise un ton expert mais accessible. Réponds en français.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    logger.info("AI reasoning generated successfully", {
      championId: input.championId,
      role: input.role,
    });

    const parsed = JSON.parse(responseText.trim()) as Record<string, unknown>;
    return {
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "",
      strengths: typeof parsed.strengths === "string" ? parsed.strengths : "",
      weaknesses: typeof parsed.weaknesses === "string" ? parsed.weaknesses : "",
      playstyle: typeof parsed.playstyle === "string" ? parsed.playstyle : "",
    };
  } catch (error) {
    logger.error("Error generating AI reasoning", toError(error));
    return generateBasicReasoning(input);
  }
}

/**
 * Generate basic reasoning without AI (fallback)
 */
function generateBasicReasoning(input: CompositionAnalysisInput): CompositionAnalysisResult {
  const championDisplay = input.championName || input.championId;

  // Reasoning
  const reasoningParts: string[] = [];
  if (input.winRate >= 0.55) {
    reasoningParts.push(
      `${championDisplay} affiche une excellente performance avec ${(input.winRate * 100).toFixed(1)}% de victoires`
    );
  } else if (input.winRate >= 0.5) {
    reasoningParts.push(
      `${championDisplay} montre une bonne performance avec ${(input.winRate * 100).toFixed(1)}% de victoires`
    );
  } else {
    reasoningParts.push(
      `${championDisplay} a un win rate de ${(input.winRate * 100).toFixed(1)}%`
    );
  }
  if (input.avgKDA >= 3.5) {
    reasoningParts.push(`Son KDA élevé de ${input.avgKDA.toFixed(2)} démontre une excellente capacité à rester en vie`);
  } else if (input.avgKDA >= 2.5) {
    reasoningParts.push(`Avec un KDA de ${input.avgKDA.toFixed(2)}, il contribue positivement aux combats`);
  }
  if (input.synergies.length > 0 && input.synergies[0].winRate >= 0.55) {
    const bestSynergy = input.synergies[0];
    reasoningParts.push(
      `Excellente synergie avec ${bestSynergy.championId} (${(bestSynergy.winRate * 100).toFixed(1)}% de victoires ensemble)`
    );
  }

  // Strengths
  const strengthParts: string[] = [];
  strengthParts.push(`Win rate: ${(input.winRate * 100).toFixed(1)}%, KDA moyen: ${input.avgKDA.toFixed(2)}`);
  if (input.synergies.length > 0 && input.synergies[0].winRate >= 0.55) {
    strengthParts.push(`Synergie forte avec ${input.synergies[0].championId}`);
  }

  // Weaknesses
  const weaknessParts: string[] = [];
  if (input.counters.length > 0) {
    weaknessParts.push(
      `Difficile contre: ${input.counters.slice(0, 3).map((c) => c.championId).join(", ")}`
    );
  }

  // Playstyle
  const roleDescriptions: Record<string, string> = {
    top: "Lane isolée, focus sur les duels et le split push",
    jungle: "Contrôle de la carte, ganks et objectifs",
    mid: "Roaming et impact sur les autres lanes",
    adc: "Farming intensif et damage dealing en teamfight",
    support: "Protection des alliés et contrôle de vision",
  };
  const playstyle = roleDescriptions[input.role] ?? "Adaptez votre style de jeu à la composition";

  return {
    reasoning: reasoningParts.join(". ") + ".",
    strengths: strengthParts.join(". "),
    weaknesses: weaknessParts.join(". ") || "",
    playstyle,
  };
}

/**
 * Batch generate AI reasoning for multiple suggestions
 * Limits concurrent API calls to avoid rate limiting
 */
export async function batchGenerateReasoning(
  inputs: CompositionAnalysisInput[],
  maxConcurrent: number = 5
): Promise<Map<string, CompositionAnalysisResult>> {
  const results = new Map<string, CompositionAnalysisResult>();

  // Process in batches
  for (let i = 0; i < inputs.length; i += maxConcurrent) {
    const batch = inputs.slice(i, i + maxConcurrent);
    const batchPromises = batch.map(async (input) => {
      const key = `${input.championId}-${input.role}`;
      const result = await generateCompositionReasoning(input);
      return { key, result };
    });

    const batchResults = await Promise.all(batchPromises);
    for (const { key, result } of batchResults) {
      results.set(key, result);
    }

    // Small delay between batches to avoid rate limiting
    if (i + maxConcurrent < inputs.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}
