import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLocaleFromRequest, createTranslator } from "@/lib/i18n-server";
import { logger } from "@/lib/logger";
import { alerting } from "@/lib/alerting";

/**
 * Types pour les helpers API
 */
export interface SerializedLeagueAccount {
  id: string;
  puuid: string;
  riotRegion: string | null;
  riotGameName: string | null;
  riotTagLine: string | null;
  profileIconId: number | null;
}

export interface SerializedUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscriptionTier: string;
  subscriptionExpiresAt: string | null;
  dailyAnalysesUsed: number;
  lastDailyReset: string | null;
  leagueAccount: SerializedLeagueAccount | null;
}

export interface UserForSerialization {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
  dailyAnalysesUsed: number;
  lastDailyReset: Date | null;
  leagueAccount?: {
    id: string;
    puuid: string;
    riotRegion: string | null;
    riotGameName: string | null;
    riotTagLine: string | null;
    profileIconId: number | null;
  } | null;
}

/**
 * Contexte de requête API avec locale et translator
 */
export interface RequestContext {
  locale: string;
  t: (key: string) => string;
}

/**
 * Récupère le contexte de la requête (locale et translator)
 * Utiliser une seule fois par handler pour éviter la duplication
 */
export function getRequestContext(request: NextRequest): RequestContext {
  const locale = getLocaleFromRequest(request.headers);
  const t = createTranslator(locale);
  return { locale, t };
}

/**
 * Sérialise un utilisateur pour la réponse API
 * Gère les dates et les relations de manière cohérente
 */
export function serializeUser(user: UserForSerialization): SerializedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    subscriptionTier: user.subscriptionTier,
    subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString() ?? null,
    dailyAnalysesUsed: user.dailyAnalysesUsed,
    lastDailyReset: user.lastDailyReset?.toISOString() ?? null,
    leagueAccount: user.leagueAccount
      ? {
          id: user.leagueAccount.id,
          puuid: user.leagueAccount.puuid,
          riotRegion: user.leagueAccount.riotRegion,
          riotGameName: user.leagueAccount.riotGameName,
          riotTagLine: user.leagueAccount.riotTagLine,
          profileIconId: user.leagueAccount.profileIconId,
        }
      : null,
  };
}

/**
 * Format d'erreur API standardisé
 */
export interface ApiErrorFormat {
  error: string;
  details?: unknown;
}

/**
 * Gère les erreurs Zod de manière cohérente
 */
export function handleZodError(error: z.ZodError): NextResponse<ApiErrorFormat> {
  logger.warn("Erreur de validation", { errors: error.errors });
  return NextResponse.json(
    { error: "Données invalides", details: error.errors },
    { status: 400 }
  );
}

/**
 * Gère les erreurs API génériques de manière cohérente
 */
export function handleApiError(
  error: unknown,
  context: string,
  alertCategory: "auth" | "api" | "database" | "external" = "api"
): NextResponse<ApiErrorFormat> {
  logger.error(`Erreur: ${context}`, error as Error);
  alerting.medium(
    context,
    error instanceof Error ? error.message : "Erreur inconnue",
    alertCategory
  );
  return NextResponse.json(
    { error: `Erreur: ${context}` },
    { status: 500 }
  );
}

/**
 * Parse le body JSON de manière sécurisée avec logging
 */
export async function safeParseJson<T = unknown>(
  request: Request
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await request.json();
    return { data: data as T, error: null };
  } catch {
    logger.warn("Erreur de parsing JSON");
    return { data: null, error: "Corps de requête invalide" };
  }
}

/**
 * Crée une réponse d'erreur standardisée
 */
export function errorResponse(
  message: string,
  status: number = 400,
  details?: unknown
): NextResponse<ApiErrorFormat> {
  const body: ApiErrorFormat = { error: message };
  if (details !== undefined) {
    body.details = details;
  }
  return NextResponse.json(body, { status });
}

/**
 * Crée une réponse de succès standardisée
 */
export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse<T> {
  return NextResponse.json(data, { status });
}
