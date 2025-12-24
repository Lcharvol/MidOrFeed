import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { prismaWithTimeout } from "@/lib/timeout";
import { readAndValidateBody } from "@/lib/request-validation";
import {
  getRequestContext,
  handleZodError,
  handleApiError,
  errorResponse,
} from "@/lib/api-helpers";
import type { SignupRequest, SignupResponse } from "@/types/api";

const createSignupSchema = (t: (key: string) => string) =>
  z
    .object({
      name: z.string().min(2, t("signup.nameMinCharacters")),
      email: z.string().email(t("signup.invalidEmail")),
      password: z.string().min(8, t("signup.passwordMinCharacters")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("signup.passwordsDoNotMatch"),
      path: ["confirmPassword"],
    }) satisfies z.ZodType<SignupRequest>;

export async function POST(request: NextRequest) {
  // Rate limiting strict pour l'inscription
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
    const signupSchema = createSignupSchema(t);

    // Valider les données
    const validatedData = signupSchema.parse(body);

    // Vérifier si l'utilisateur existe déjà avec timeout
    const existingUser = await prismaWithTimeout(
      () =>
        prisma.user.findUnique({
          where: { email: validatedData.email },
        }),
      10000 // 10 secondes
    );

    if (existingUser) {
      return errorResponse(
        t("signup.emailAlreadyUsed") ?? "Cet email est déjà utilisé",
        400
      );
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Créer l'utilisateur avec timeout
    const user = await prismaWithTimeout(
      () =>
        prisma.user.create({
          data: {
            name: validatedData.name,
            email: validatedData.email,
            password: hashedPassword,
          },
        }),
      10000 // 10 secondes
    );

    const response: SignupResponse = {
      message: "Compte créé avec succès",
      userId: user.id,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error);
    }
    return handleApiError(error, "Création du compte", "auth");
  }
}
