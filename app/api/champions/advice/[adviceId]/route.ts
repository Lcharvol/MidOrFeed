import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { requireCsrf } from "@/lib/csrf";

type Params = {
  adviceId: string;
};

export const DELETE = async (
  request: NextRequest,
  context: { params: Promise<Params> }
) => {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.strict);
  if (rateLimitResponse) return rateLimitResponse;

  const csrfError = await requireCsrf(request);
  if (csrfError) return csrfError;

  const { adviceId } = await context.params;
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentification requise" },
      { status: 401 }
    );
  }

  const advice = await prisma.championAdvice.findUnique({
    where: { id: adviceId },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!advice) {
    return NextResponse.json(
      { success: false, error: "Commentaire introuvable" },
      { status: 404 }
    );
  }

  if (advice.authorId !== user.id) {
    return NextResponse.json(
      { success: false, error: "Suppression non autorisée" },
      { status: 403 }
    );
  }

  await prisma.championAdvice.delete({
    where: { id: advice.id },
  });

  return NextResponse.json({ success: true });
};


