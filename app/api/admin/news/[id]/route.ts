import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { z } from "zod";

const updateArticleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  externalUrl: z.string().url().optional().nullable().or(z.literal("")),
  status: z.enum(["draft", "published"]).optional(),
  publishedAt: z.string().datetime().optional().nullable(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.admin);
  if (rateLimitResponse) return rateLimitResponse;

  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = updateArticleSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Invalid data";
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const existing = await prisma.newsArticle.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      );
    }

    const { title, excerpt, imageUrl, externalUrl, status, publishedAt } = parsed.data;

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (excerpt !== undefined) data.excerpt = excerpt || null;
    if (imageUrl !== undefined) data.imageUrl = imageUrl || null;
    if (externalUrl !== undefined) data.externalUrl = externalUrl || null;
    if (status !== undefined) data.status = status;
    if (publishedAt !== undefined) {
      data.publishedAt = publishedAt ? new Date(publishedAt) : null;
    }
    // Auto-set publishedAt when publishing for the first time
    if (status === "published" && !existing.publishedAt && publishedAt === undefined) {
      data.publishedAt = new Date();
    }

    const article = await prisma.newsArticle.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, article });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error updating article" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.admin);
  if (rateLimitResponse) return rateLimitResponse;

  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { id } = await params;

    const existing = await prisma.newsArticle.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      );
    }

    await prisma.newsArticle.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error deleting article" },
      { status: 500 }
    );
  }
}
