import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { readAndValidateBody } from "@/lib/request-validation";
import { withApiMonitoring } from "@/lib/api-monitoring";
import { logger } from "@/lib/logger";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/jwt";
import { errorResponse } from "@/lib/api-helpers";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
});

export async function POST(request: NextRequest) {
  return withApiMonitoring(
    request,
    async () => {
      // Rate limiting strict
      const rateLimitResponse = await rateLimit(request, rateLimitPresets.auth);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      try {
        // Verify JWT token
        const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
        if (!token) {
          return errorResponse("Non authentifié", 401);
        }

        const payload = await verifyToken(token);
        if (!payload || !payload.userId) {
          return errorResponse("Token invalide", 401);
        }

        // Read and validate body
        const body = await readAndValidateBody(request);
        const validatedData = changePasswordSchema.parse(body);

        // Find user with password
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            password: true,
          },
        });

        if (!user) {
          return errorResponse("Utilisateur non trouvé", 404);
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(
          validatedData.currentPassword,
          user.password
        );

        if (!isPasswordValid) {
          logger.warn("Tentative de changement de mot de passe avec mot de passe incorrect", {
            userId: user.id,
          });
          return errorResponse("Mot de passe actuel incorrect", 400);
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);

        // Update password
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });

        logger.info("Mot de passe modifié avec succès", {
          userId: user.id,
        });

        return NextResponse.json({
          success: true,
          message: "Mot de passe modifié avec succès",
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return errorResponse(error.errors[0].message, 400);
        }

        logger.error("Erreur lors du changement de mot de passe", error as Error);
        return errorResponse("Erreur lors du changement de mot de passe", 500);
      }
    },
    "POST /api/auth/change-password"
  );
}
