import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { z } from "zod";

const updateUserSchema = z.object({
  userId: z.string().min(1, "ID utilisateur manquant"),
  role: z.enum(["user", "admin"]).optional(),
  dailyAnalysisLimit: z.number().int().min(0).max(1000).optional(),
}).refine(
  (data) => data.role !== undefined || data.dailyAnalysisLimit !== undefined,
  { message: "Aucune modification fournie" }
);

export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.admin);
  if (rateLimitResponse) return rateLimitResponse;

  // Skip CSRF for GET requests
  const authError = await requireAdmin(request, { skipCsrf: true });
  if (authError) return authError;
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get("pageSize") ?? "20", 10)));
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
        riotPuuid: true,
        riotRegion: true,
        leagueAccount: {
          select: {
            riotGameName: true,
            riotTagLine: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json(
      {
        success: true,
        users,
        pagination: { page, pageSize, totalCount, totalPages },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erreur list users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.admin);
  if (rateLimitResponse) return rateLimitResponse;

  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const body = await request.json().catch(() => null);
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Données invalides";
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const { userId, role, dailyAnalysisLimit } = parsed.data;

    const updateData: { role?: string; dailyAnalysisLimit?: number } = {};
    if (role !== undefined) updateData.role = role;
    if (dailyAnalysisLimit !== undefined) updateData.dailyAnalysisLimit = dailyAnalysisLimit;

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
    return NextResponse.json({ success: false, error: "Erreur mise à jour utilisateur" }, { status: 500 });
  }
}
