import { z } from "zod";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; issues?: z.ZodIssue[] };

const buildInvalidFormatResult = (error: z.ZodError): ValidationResult<never> => ({
  ok: false,
  error: "Invalid API response format",
  issues: error.issues,
});

const championEntitySchema = z
  .object({
    championId: z.string(),
    name: z.string(),
    championKey: z.number().optional(),
  })
  .passthrough();

const championListSuccessSchema = z
  .object({
    success: z.literal(true),
    data: z.array(championEntitySchema),
    count: z.number().int().nonnegative().optional(),
  })
  .passthrough();

const championListErrorSchema = z
  .object({ success: z.literal(false), error: z.string() })
  .passthrough();

const championListResponseSchema = z.union([
  championListSuccessSchema,
  championListErrorSchema,
]);

type ChampionListSuccess = z.infer<typeof championListSuccessSchema>;

export const validateChampionListResponse = (
  input: unknown
): ValidationResult<{ champions: ChampionListSuccess["data"]; count: number | undefined }> => {
  const parsed = championListResponseSchema.safeParse(input);
  if (!parsed.success) {
    return buildInvalidFormatResult(parsed.error);
  }
  if (!parsed.data.success) {
    return { ok: false, error: parsed.data.error };
  }
  return {
    ok: true,
    value: {
      champions: parsed.data.data,
      count: parsed.data.count,
    },
  };
};

const tierListChampionStatsSchema = z
  .object({
    id: z.string(),
    championId: z.string(),
    totalGames: z.number(),
    totalWins: z.number(),
    totalLosses: z.number(),
    winRate: z.number(),
    avgKills: z.number(),
    avgDeaths: z.number(),
    avgAssists: z.number(),
    avgKDA: z.number(),
    avgGoldEarned: z.number(),
    avgGoldSpent: z.number(),
    avgDamageDealt: z.number(),
    avgDamageTaken: z.number(),
    avgVisionScore: z.number(),
    topRole: z.string().nullable(),
    topLane: z.string().nullable(),
    score: z.number(),
    lastAnalyzedAt: z.string(),
  })
  .passthrough();

const championStatsSuccessSchema = z
  .object({
    success: z.literal(true),
    data: z.array(tierListChampionStatsSchema),
    count: z.number().int().nonnegative().optional(),
  })
  .passthrough();

const championStatsErrorSchema = z
  .object({ success: z.literal(false), error: z.string() })
  .passthrough();

const championStatsResponseSchema = z.union([
  championStatsSuccessSchema,
  championStatsErrorSchema,
]);

type ChampionStatsSuccess = z.infer<typeof championStatsSuccessSchema>;

export const validateChampionStatsResponse = (
  input: unknown
): ValidationResult<{ stats: ChampionStatsSuccess["data"]; count: number | undefined }> => {
  const parsed = championStatsResponseSchema.safeParse(input);
  if (!parsed.success) {
    return buildInvalidFormatResult(parsed.error);
  }
  if (!parsed.data.success) {
    return { ok: false, error: parsed.data.error };
  }
  return {
    ok: true,
    value: {
      stats: parsed.data.data,
      count: parsed.data.count,
    },
  };
};

const counterPickPairSchema = z
  .object({
    enemyChampionId: z.string(),
    games: z.number(),
    wins: z.number(),
    losses: z.number(),
    winRate: z.number(),
    lastPlayedAt: z.string(),
  })
  .passthrough();

const counterPickSuccessSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        championId: z.string(),
        totalMatches: z.number(),
        pairs: z.array(counterPickPairSchema),
      })
      .passthrough(),
  })
  .passthrough();

const counterPickErrorSchema = z
  .object({ success: z.literal(false), error: z.string() })
  .passthrough();

const counterPickResponseSchema = z.union([
  counterPickSuccessSchema,
  counterPickErrorSchema,
]);

type CounterPickSuccess = z.infer<typeof counterPickSuccessSchema>;

export const validateCounterPickResponse = (
  input: unknown
): ValidationResult<CounterPickSuccess["data"]> => {
  const parsed = counterPickResponseSchema.safeParse(input);
  if (!parsed.success) {
    return buildInvalidFormatResult(parsed.error);
  }
  if (!parsed.data.success) {
    return { ok: false, error: parsed.data.error };
  }
  return { ok: true, value: parsed.data.data };
};

const buildItemReferenceSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  image: z.string().nullable(),
});

const championBuildItemSchema = buildItemReferenceSchema.extend({
  picks: z.number(),
  wins: z.number(),
  pickRate: z.number(),
  winRate: z.number(),
});

const championBuildVariantSchema = z.object({
  items: z.array(buildItemReferenceSchema),
  picks: z.number(),
  wins: z.number(),
  pickRate: z.number(),
  winRate: z.number(),
});

const championBuildSuccessSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      championId: z.string(),
      sampleSize: z.number(),
      lastMatchAt: z.string().nullable(),
      coreItems: z.array(championBuildItemSchema),
      situationalItems: z.array(championBuildItemSchema),
      bootOptions: z.array(championBuildItemSchema),
      popularBuilds: z.array(championBuildVariantSchema),
    }),
  })
  .passthrough();

const championBuildErrorSchema = z
  .object({ success: z.literal(false), error: z.string() })
  .passthrough();

const championBuildResponseSchema = z.union([
  championBuildSuccessSchema,
  championBuildErrorSchema,
]);

type ChampionBuildSuccess = z.infer<typeof championBuildSuccessSchema>;

export const validateChampionBuildResponse = (
  input: unknown
): ValidationResult<ChampionBuildSuccess["data"]> => {
  const parsed = championBuildResponseSchema.safeParse(input);
  if (!parsed.success) {
    return buildInvalidFormatResult(parsed.error);
  }
  if (!parsed.data.success) {
    return { ok: false, error: parsed.data.error };
  }
  return { ok: true, value: parsed.data.data };
};

const championAdviceVoteValueSchema = z.union([
  z.literal(-1),
  z.literal(0),
  z.literal(1),
]);

const championAdviceEntrySchema = z.object({
  id: z.string(),
  championId: z.string(),
  authorId: z.string().nullable(),
  authorName: z.string().nullable(),
  content: z.string(),
  score: z.number(),
  upvotes: z.number(),
  downvotes: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  viewerVote: championAdviceVoteValueSchema.nullable(),
  canDelete: z.boolean().optional(),
});

const championAdviceListSuccessSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      championId: z.string(),
      advices: z.array(championAdviceEntrySchema),
    }),
  })
  .passthrough();

const championAdviceSingleSuccessSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      advice: championAdviceEntrySchema,
    }),
  })
  .passthrough();

const championAdviceErrorSchema = z
  .object({ success: z.literal(false), error: z.string() })
  .passthrough();

const championAdviceListResponseSchema = z.union([
  championAdviceListSuccessSchema,
  championAdviceErrorSchema,
]);

const championAdviceSingleResponseSchema = z.union([
  championAdviceSingleSuccessSchema,
  championAdviceErrorSchema,
]);

type ChampionAdviceListSuccess = z.infer<typeof championAdviceListSuccessSchema>;
type ChampionAdviceSingleSuccess = z.infer<
  typeof championAdviceSingleSuccessSchema
>;

export const validateChampionAdviceListResponse = (
  input: unknown
): ValidationResult<ChampionAdviceListSuccess["data"]> => {
  const parsed = championAdviceListResponseSchema.safeParse(input);
  if (!parsed.success) {
    return buildInvalidFormatResult(parsed.error);
  }
  if (!parsed.data.success) {
    return { ok: false, error: parsed.data.error };
  }
  return { ok: true, value: parsed.data.data };
};

export const validateChampionAdviceSingleResponse = (
  input: unknown
): ValidationResult<ChampionAdviceSingleSuccess["data"]> => {
  const parsed = championAdviceSingleResponseSchema.safeParse(input);
  if (!parsed.success) {
    return buildInvalidFormatResult(parsed.error);
  }
  if (!parsed.data.success) {
    return { ok: false, error: parsed.data.error };
  }
  return { ok: true, value: parsed.data.data };
};

const matchParticipantSummarySchema = z
  .object({
    id: z.string(),
    participantId: z.number(),
    participantPUuid: z.string().nullable()
      .or(z.undefined())
      .transform((value) => (value === undefined ? null : value)),
    teamId: z.number(),
    championId: z.string(),
    championName: z.string().nullable().optional(),
    role: z.string().nullable(),
    lane: z.string().nullable(),
    kills: z.number(),
    deaths: z.number(),
    assists: z.number(),
    goldEarned: z.number(),
    totalDamageDealtToChampions: z.number(),
    totalDamageTaken: z.number(),
    visionScore: z.number(),
    win: z.boolean(),
    match: z
      .object({
        queueId: z.number().nullable(),
        region: z.string().nullable(),
        gameDuration: z.number(),
        gameMode: z.string().nullable(),
        platformId: z.string().nullable(),
        gameVersion: z.string().nullable(),
        gameCreation: z.string(),
      })
      .optional(),
  })
  .passthrough();

const matchSummarySchema = z
  .object({
    id: z.string(),
    matchId: z.string(),
    gameCreation: z.string(),
    gameDuration: z.number(),
    queueId: z.number().nullable(),
    region: z.string().nullable(),
    gameMode: z.string().nullable(),
    platformId: z.string().nullable(),
    gameVersion: z.string().nullable(),
    blueTeamWon: z.boolean().nullable().optional(),
    redTeamWon: z.boolean().nullable().optional(),
    participants: z.array(matchParticipantSummarySchema),
  })
  .passthrough();

const matchesAggregateStatsSchema = z.object({
  totalGames: z.number(),
  totalWins: z.number(),
  winRate: z.string(),
  avgKDA: z.string(),
  totalKills: z.number(),
  totalDeaths: z.number(),
  totalAssists: z.number(),
});

const championStatEntrySchema = z.object({
  played: z.number(),
  wins: z.number(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
});

const roleStatEntrySchema = z.object({
  played: z.number(),
  wins: z.number(),
});

const matchesPayloadSchema = z.object({
  matches: z.array(matchSummarySchema),
  stats: matchesAggregateStatsSchema,
  championStats: z.record(championStatEntrySchema),
  roleStats: z.record(roleStatEntrySchema),
});

const matchesSuccessSchema = z
  .object({
    success: z.literal(true),
    data: matchesPayloadSchema,
  })
  .passthrough();

const matchesErrorSchema = z
  .object({ success: z.literal(false), error: z.string() })
  .passthrough();

const matchesResponseSchema = z.union([
  matchesSuccessSchema,
  matchesErrorSchema,
]);

type MatchesSuccess = z.infer<typeof matchesSuccessSchema>;

export const validateMatchesResponse = (
  input: unknown
): ValidationResult<MatchesSuccess["data"]> => {
  const parsed = matchesResponseSchema.safeParse(input);
  if (!parsed.success) {
    return buildInvalidFormatResult(parsed.error);
  }
  if (!parsed.data.success) {
    return { ok: false, error: parsed.data.error };
  }
  return { ok: true, value: parsed.data.data };
};

const compositionSuggestionSchema = z
  .object({
    id: z.string(),
    rank: z.number(),
    role: z.enum(["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]),
    teamChampions: z.array(z.string()),
    enemyChampions: z.array(z.string()),
    suggestedChampion: z.string(),
    confidence: z.number(),
    reasoning: z.string().nullable().optional(),
    strengths: z.string().nullable().optional(),
    weaknesses: z.string().nullable().optional(),
    playstyle: z.string().nullable().optional(),
    gameMode: z.string().nullable().optional(),
    tier: z.string().nullable().optional(),
    updatedAt: z.string(),
  })
  .passthrough();

const compositionSuggestionsPayloadSchema = z.object({
  compositions: z.array(compositionSuggestionSchema),
  total: z.number(),
  generatedAt: z.string(),
});

const compositionSuggestionsSuccessSchema = z
  .object({
    success: z.literal(true),
    data: compositionSuggestionsPayloadSchema,
  })
  .passthrough();

const compositionSuggestionsErrorSchema = z
  .object({ success: z.literal(false), error: z.string() })
  .passthrough();

const compositionSuggestionsResponseSchema = z.union([
  compositionSuggestionsSuccessSchema,
  compositionSuggestionsErrorSchema,
]);

type CompositionSuggestionsSuccess = z.infer<
  typeof compositionSuggestionsSuccessSchema
>;

export const validateCompositionSuggestionsResponse = (
  input: unknown
): ValidationResult<CompositionSuggestionsSuccess["data"]> => {
  const parsed = compositionSuggestionsResponseSchema.safeParse(input);
  if (!parsed.success) {
    return buildInvalidFormatResult(parsed.error);
  }
  if (!parsed.data.success) {
    return { ok: false, error: parsed.data.error };
  }
  return { ok: true, value: parsed.data.data };
};
