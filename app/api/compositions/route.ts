import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { readAndValidateBody } from "@/lib/request-validation";
import { requireCsrf } from "@/lib/csrf";
import {
  getRequestContext,
  handleZodError,
  handleApiError,
  errorResponse,
} from "@/lib/api-helpers";

const createCompositionSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("compositions.compositionNameRequired") ?? "Le nom est requis"),
    top: z.string().optional().nullable(),
    jungle: z.string().optional().nullable(),
    mid: z.string().optional().nullable(),
    adc: z.string().optional().nullable(),
    support: z.string().optional().nullable(),
  });

/**
 * POST /api/compositions - Créer une nouvelle composition
 */
export async function POST(request: NextRequest) {
  // CSRF validation
  const csrfError = await requireCsrf(request);
  if (csrfError) return csrfError;

  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Récupérer le contexte de la requête une seule fois
  const { t } = getRequestContext(request);

  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return errorResponse("Non authentifié", 401);
    }

    const body = await readAndValidateBody(request);
    const schema = createCompositionSchema(t);
    const validatedData = schema.parse(body);

    // Vérifier qu'au moins un champion est sélectionné
    const selectedChampions = [
      validatedData.top,
      validatedData.jungle,
      validatedData.mid,
      validatedData.adc,
      validatedData.support,
    ].filter((champ) => champ !== null && champ !== undefined);

    if (selectedChampions.length === 0) {
      return errorResponse(
        t("compositions.atLeastOneChampion") ?? "Au moins un champion est requis",
        400
      );
    }

    const composition = await prisma.composition.create({
      data: {
        userId: authUser.id,
        name: validatedData.name,
        top: validatedData.top ?? null,
        jungle: validatedData.jungle ?? null,
        mid: validatedData.mid ?? null,
        adc: validatedData.adc ?? null,
        support: validatedData.support ?? null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: composition,
        message: t("compositions.compositionSaved") ?? "Composition sauvegardée",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error);
    }
    return handleApiError(error, "Création de la composition", "database");
  }
}

/**
 * GET /api/compositions - Récupérer les compositions de l'utilisateur
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return errorResponse("Non authentifié", 401);
    }

    const compositions = await prisma.composition.findMany({
      where: {
        userId: authUser.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: compositions,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, "Récupération des compositions", "database");
  }
}

