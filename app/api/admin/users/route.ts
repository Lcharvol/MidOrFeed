import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscriptionTier: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ success: true, users }, { status: 200 });
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
      .catch(() => ({} as { userId?: string; role?: string }));
    const userId = body?.userId ?? "";
    const role = body?.role?.toLowerCase() ?? "";
    if (!userId || (role !== "user" && role !== "admin")) {
      return NextResponse.json(
        { error: "Paramètres invalides" },
        { status: 400 }
      );
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    return NextResponse.json(
      { success: true, user: { id: updated.id, role: updated.role } },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Erreur update role" }, { status: 500 });
  }
}
