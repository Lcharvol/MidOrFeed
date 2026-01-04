import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { createLogger } from "@/lib/logger";

const logger = createLogger("admin-matches");

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request, { skipCsrf: true });
  if (authError) return authError;

  try {
    const totalMatches = await prisma.match.count();
    return NextResponse.json({
      success: true,
      data: {
        totalMatches,
      },
    });
  } catch (error) {
    logger.error("Match count error", error as Error);
    return NextResponse.json(
      {
        success: false,
        error: "Impossible de récupérer le nombre de matchs",
      },
      { status: 500 }
    );
  }
}
