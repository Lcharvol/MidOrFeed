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
import { alerting } from "@/lib/alerting";
import type { LoginRequest, LoginResponse } from "@/types/api";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
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

      try {
        // Lire et valider la taille du body
        const body = await readAndValidateBody(request);

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
          return NextResponse.json(
            { error: "Email ou mot de passe incorrect" },
            { status: 401 }
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
          return NextResponse.json(
            { error: "Email ou mot de passe incorrect" },
            { status: 401 }
          );
        }

        // Récupérer le compte League of Legends depuis les tables shardées si disponible
        let leagueAccount = null;
        if (user.leagueAccountId) {
          // Note: On ne peut plus utiliser include avec les tables shardées
          // On doit chercher par PUUID dans toutes les régions
          // Pour optimiser, on pourrait stocker le PUUID dans User
          // Pour l'instant, on retourne null - l'utilisateur peut reconnecter son compte
          // TODO: Stocker puuid et riotRegion dans User pour optimiser cette recherche
          leagueAccount = null;
        }

        // Retourner les informations utilisateur (sans le mot de passe)
        const response: LoginResponse = {
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
            leagueAccount: null, // Note: Le compte doit être récupéré séparément maintenant
          },
        };

        logger.info("Connexion réussie", {
          userId: user.id,
          email: user.email,
        });
        return NextResponse.json(response, { status: 200 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          logger.warn("Erreur de validation lors de la connexion", {
            errors: error.errors,
          });
          return NextResponse.json(
            { error: "Données invalides", details: error.errors },
            { status: 400 }
          );
        }

        logger.error("Erreur lors de la connexion", error as Error);
        alerting.medium(
          "Erreur lors de la connexion",
          error instanceof Error ? error.message : "Erreur inconnue",
          "auth"
        );
        return NextResponse.json(
          { error: "Erreur lors de la connexion" },
          { status: 500 }
        );
      }
    },
    "POST /api/auth/login"
  );
}
