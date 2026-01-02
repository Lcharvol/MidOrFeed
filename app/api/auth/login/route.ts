import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { prismaWithTimeout } from "@/lib/timeout";
import { measureTiming } from "@/lib/metrics";
import { readAndValidateBody } from "@/lib/request-validation";
import { withApiMonitoring } from "@/lib/api-monitoring";
import { logger } from "@/lib/logger";
import { generateToken, createAuthResponse } from "@/lib/jwt";
import { ShardedLeagueAccounts } from "@/lib/prisma-sharded-accounts";
import {
  getRequestContext,
  handleZodError,
  handleApiError,
  errorResponse,
} from "@/lib/api-helpers";
import type { LoginRequest, LoginResponse } from "@/types/api";

const createLoginSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t("login.invalidEmail")),
    password: z.string().min(1, t("login.passwordRequired")),
  }) satisfies z.ZodType<LoginRequest>;

export async function POST(request: NextRequest) {
  return withApiMonitoring(
    request,
    async () => {
      // Rate limiting strict pour l'authentification
      const rateLimitResponse = await rateLimit(request, rateLimitPresets.auth);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // Récupérer le contexte de la requête une seule fois
      const { t } = getRequestContext(request);

      try {
        // Lire et valider la taille du body
        const body = await readAndValidateBody(request);

        // Créer le schéma avec les traductions
        const loginSchema = createLoginSchema(t);

        // Valider les données
        const validatedData = loginSchema.parse(body);

        // Trouver l'utilisateur avec timeout et métriques
        const user = await measureTiming(
          "api.auth.login.findUser",
          () =>
            prismaWithTimeout(
              () =>
                prisma.user.findUnique({
                  where: { email: validatedData.email },
                  select: {
                    id: true,
                    email: true,
                    name: true,
                    password: true,
                    role: true,
                    subscriptionTier: true,
                    subscriptionExpiresAt: true,
                    dailyAnalysesUsed: true,
                    lastDailyReset: true,
                    leagueAccountId: true,
                    riotPuuid: true,
                    riotRegion: true,
                  },
                }),
              10000 // 10 secondes
            ),
          { email: validatedData.email }
        );

        if (!user) {
          logger.warn("Tentative de connexion avec email inexistant", {
            email: validatedData.email,
          });
          return errorResponse(
            t("login.error") ?? "Email ou mot de passe incorrect",
            401
          );
        }

        // Vérifier le mot de passe avec métriques
        const isPasswordValid = await measureTiming(
          "api.auth.login.comparePassword",
          () => bcrypt.compare(validatedData.password, user.password)
        );

        if (!isPasswordValid) {
          logger.warn("Tentative de connexion avec mot de passe incorrect", {
            email: validatedData.email,
            userId: user.id,
          });
          return errorResponse(
            t("login.error") ?? "Email ou mot de passe incorrect",
            401
          );
        }

        // Récupérer le compte League of Legends depuis les tables shardées si disponible
        let leagueAccount = null;
        if (user.riotPuuid && user.riotRegion) {
          // Utiliser les champs puuid et riotRegion stockés dans User pour un lookup direct
          const account = await ShardedLeagueAccounts.findUniqueByPuuid(
            user.riotPuuid,
            user.riotRegion
          );

          if (account) {
            leagueAccount = {
              id: account.id,
              puuid: account.puuid,
              riotRegion: account.riotRegion,
              riotGameName: account.riotGameName ?? null,
              riotTagLine: account.riotTagLine ?? null,
              profileIconId: account.profileIconId ?? null,
            };
          }
        } else if (user.leagueAccountId) {
          // Fallback: chercher globalement si puuid/region ne sont pas stockés
          // (pour les anciens comptes)
          logger.warn("User avec leagueAccountId mais sans puuid/region", {
            userId: user.id,
            leagueAccountId: user.leagueAccountId,
          });
          leagueAccount = null;
        }

        // Mettre à jour la date de dernière connexion
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Générer un token JWT
        const token = await generateToken({
          userId: user.id,
          email: user.email,
          role: user.role,
        });

        // Retourner les informations utilisateur (sans le mot de passe)
        // Token is set in HTTP-only cookie, not in response body
        const responseData: Omit<LoginResponse, "token"> = {
          message: "Connexion réussie",
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            subscriptionTier: user.subscriptionTier,
            subscriptionExpiresAt:
              user.subscriptionExpiresAt?.toISOString() ?? null,
            dailyAnalysesUsed: user.dailyAnalysesUsed,
            lastDailyReset: user.lastDailyReset.toISOString(),
            leagueAccount,
          },
        };

        logger.info("Connexion réussie", {
          userId: user.id,
          email: user.email,
        });

        // Return response with token in HTTP-only cookie
        return createAuthResponse(responseData, token);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return handleZodError(error);
        }
        return handleApiError(error, "Connexion", "auth");
      }
    },
    "POST /api/auth/login"
  );
}
