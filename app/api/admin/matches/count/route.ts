import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
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
    console.error("[ADMIN_MATCH_COUNT]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Impossible de récupérer le nombre de matchs",
      },
      { status: 500 }
    );
  }
}
