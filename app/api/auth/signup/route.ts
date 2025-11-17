import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { prismaWithTimeout } from "@/lib/timeout";
import { readAndValidateBody } from "@/lib/request-validation";
import type { SignupRequest, SignupResponse, ApiResponse } from "@/types/api";

const signupSchema = z
  .object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide"),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  }) satisfies z.ZodType<SignupRequest>;

export async function POST(request: NextRequest) {
  // Rate limiting strict pour l'inscription
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.auth);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Lire et valider la taille du body
    const body = await readAndValidateBody(request);

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
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
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
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du compte" },
      { status: 500 }
    );
  }
}
