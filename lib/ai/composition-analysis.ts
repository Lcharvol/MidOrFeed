import Anthropic from "@anthropic-ai/sdk";
import { createLogger } from "@/lib/logger";

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
}

/**
 * Generate AI-powered reasoning for a composition suggestion
 */
export async function generateCompositionReasoning(
  input: CompositionAnalysisInput
): Promise<string> {
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

  const prompt = `Tu es un expert du draft League of Legends. Génère un raisonnement de 2-3 phrases expliquant pourquoi ce champion est recommandé pour ce rôle.

Champion: ${championDisplay}
Rôle: ${input.role}
Win rate: ${(input.winRate * 100).toFixed(1)}%
KDA moyen: ${input.avgKDA.toFixed(2)}

Métriques (par minute):
- Dégâts: ${input.metrics.avgDamagePerMin.toFixed(0)}
- Gold: ${input.metrics.avgGoldPerMin.toFixed(0)}
- Vision: ${input.metrics.avgVisionPerMin.toFixed(1)}

Meilleures synergies:
${synergiesText}

Efficace contre:
${countersText}

Réponds uniquement avec le raisonnement, sans introduction ni conclusion. Utilise un ton expert mais accessible. Réponds en français.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
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

    return responseText.trim();
  } catch (error) {
    logger.error("Error generating AI reasoning", error as Error);
    return generateBasicReasoning(input);
  }
}

/**
 * Generate basic reasoning without AI (fallback)
 */
function generateBasicReasoning(input: CompositionAnalysisInput): string {
  const parts: string[] = [];
  const championDisplay = input.championName || input.championId;

  // Win rate assessment
  if (input.winRate >= 0.55) {
    parts.push(
      `${championDisplay} affiche une excellente performance avec ${(input.winRate * 100).toFixed(1)}% de victoires`
    );
  } else if (input.winRate >= 0.5) {
    parts.push(
      `${championDisplay} montre une bonne performance avec ${(input.winRate * 100).toFixed(1)}% de victoires`
    );
  } else {
    parts.push(
      `${championDisplay} a un win rate de ${(input.winRate * 100).toFixed(1)}%`
    );
  }

  // KDA assessment
  if (input.avgKDA >= 3.5) {
    parts.push(`Son KDA élevé de ${input.avgKDA.toFixed(2)} démontre une excellente capacité à rester en vie`);
  } else if (input.avgKDA >= 2.5) {
    parts.push(`Avec un KDA de ${input.avgKDA.toFixed(2)}, il contribue positivement aux combats`);
  }

  // Synergies
  if (input.synergies.length > 0 && input.synergies[0].winRate >= 0.55) {
    const bestSynergy = input.synergies[0];
    parts.push(
      `Excellente synergie avec ${bestSynergy.championId} (${(bestSynergy.winRate * 100).toFixed(1)}% de victoires ensemble)`
    );
  }

  // Counters
  if (input.counters.length > 0 && input.counters[0].winRateAgainst >= 0.55) {
    const bestCounter = input.counters[0];
    parts.push(
      `Efficace contre ${bestCounter.championId} avec ${(bestCounter.winRateAgainst * 100).toFixed(1)}% de victoires`
    );
  }

  return parts.join(". ") + ".";
}

/**
 * Batch generate AI reasoning for multiple suggestions
 * Limits concurrent API calls to avoid rate limiting
 */
export async function batchGenerateReasoning(
  inputs: CompositionAnalysisInput[],
  maxConcurrent: number = 5
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Process in batches
  for (let i = 0; i < inputs.length; i += maxConcurrent) {
    const batch = inputs.slice(i, i + maxConcurrent);
    const batchPromises = batch.map(async (input) => {
      const key = `${input.championId}-${input.role}`;
      const reasoning = await generateCompositionReasoning(input);
      return { key, reasoning };
    });

    const batchResults = await Promise.all(batchPromises);
    for (const { key, reasoning } of batchResults) {
      results.set(key, reasoning);
    }

    // Small delay between batches to avoid rate limiting
    if (i + maxConcurrent < inputs.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}
