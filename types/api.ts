/**
 * Types TypeScript stricts pour les réponses API
 */

/**
 * Réponse API standard avec succès
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

/**
 * Réponse API avec erreur
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string | unknown;
}

/**
 * Type union pour les réponses API
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Réponse paginée
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Réponse avec métadonnées
 */
export interface ApiResponseWithMeta<T, M = Record<string, unknown>> {
  success: true;
  data: T;
  meta?: M;
}

/**
 * Types pour les endpoints d'authentification
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    subscriptionTier: string;
    subscriptionExpiresAt: string | null;
    dailyAnalysesUsed: number;
    lastDailyReset: string;
    leagueAccount: null | unknown;
  };
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignupResponse {
  message: string;
  userId: string;
}

/**
 * Types pour les endpoints de champions
 */
export interface ChampionListItem {
  id: string;
  championId: string;
  name: string;
  title: string;
  blurb: string | null;
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
  // ... autres champs
}

/**
 * Types pour les endpoints d'items
 */
export interface ItemListItem {
  id: string;
  itemId: string;
  name: string;
  description: string | null;
  plaintext: string | null;
  image: string | null;
  gold: string | null;
}

/**
 * Types pour les endpoints de summoners
 */
export interface RankedData {
  solo: {
    current: {
      tier: string;
      rank: string;
      lp: number;
      wins: number;
      losses: number;
      winRate: number;
    };
    best: {
      tier: string;
      rank: string;
      lp: number;
    };
    seasonHistory: Array<{
      season: string;
      tier: string;
      rank: string;
      lp: number;
    }>;
  } | null;
  flex: {
    current: {
      tier: string;
      rank: string;
      lp: number;
      wins: number;
      losses: number;
      winRate: number;
    };
    best: {
      tier: string;
      rank: string;
      lp: number;
    };
    seasonHistory: Array<{
      season: string;
      tier: string;
      rank: string;
      lp: number;
    }>;
  } | null;
}

export interface RankedResponse {
  success: boolean;
  data: RankedData;
  error?: string;
}
