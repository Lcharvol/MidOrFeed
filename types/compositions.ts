export type CompositionRole =
  | "TOP"
  | "JUNGLE"
  | "MIDDLE"
  | "BOTTOM"
  | "UTILITY";

export interface CompositionSuggestionDTO {
  id: string;
  rank: number;
  role: CompositionRole;
  teamChampions: string[];
  enemyChampions: string[];
  suggestedChampion: string;
  confidence: number;
  reasoning?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  playstyle?: string | null;
  gameMode?: string | null;
  tier?: string | null;
  updatedAt: string;
}

export interface CompositionSuggestionsPayload {
  compositions: CompositionSuggestionDTO[];
  total: number;
  generatedAt: string;
}


