import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10))
    );
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    // Build where clause for search
    const whereClause = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / pageSize);

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscriptionTier: true,
        dailyAnalysesUsed: true,
        dailyAnalysisLimit: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json(
      {
        success: true,
        users,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Erreur list users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const body = await request
      .json()
      .catch(() => ({} as { userId?: string; role?: string; dailyAnalysisLimit?: number }));
    const userId = body?.userId ?? "";
    const role = body?.role?.toLowerCase();
    const dailyAnalysisLimit = body?.dailyAnalysisLimit;

    if (!userId) {
      return NextResponse.json(
        { error: "ID utilisateur manquant" },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: { role?: string; dailyAnalysisLimit?: number } = {};

    // Validate role if provided
    if (role !== undefined) {
      if (role !== "user" && role !== "admin") {
        return NextResponse.json(
          { error: "Rôle invalide" },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    // Validate dailyAnalysisLimit if provided
    if (dailyAnalysisLimit !== undefined) {
      const limit = parseInt(String(dailyAnalysisLimit), 10);
      if (isNaN(limit) || limit < 0 || limit > 1000) {
        return NextResponse.json(
          { error: "Limite d'analyses invalide (0-1000)" },
          { status: 400 }
        );
      }
      updateData.dailyAnalysisLimit = limit;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Aucune modification fournie" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        role: true,
        dailyAnalysisLimit: true,
      },
    });

    return NextResponse.json(
      { success: true, user: updated },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Erreur mise à jour utilisateur" }, { status: 500 });
  }
}
