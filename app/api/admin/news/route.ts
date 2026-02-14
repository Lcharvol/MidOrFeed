import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { z } from "zod";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const createArticleSchema = z.object({
  title: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  externalUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published"]).optional(),
  publishedAt: z.string().datetime().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.admin);
  if (rateLimitResponse) return rateLimitResponse;

  const authError = await requireAdmin(request, { skipCsrf: true });
  if (authError) return authError;

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get("pageSize") ?? "20", 10)));
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const status = searchParams.get("status") || "";

    const whereClause: Record<string, unknown> = {};
    if (search) {
      whereClause.title = { contains: search, mode: "insensitive" };
    }
    if (status && (status === "draft" || status === "published")) {
      whereClause.status = status;
    }

    const totalCount = await prisma.newsArticle.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / pageSize);

    const articles = await prisma.newsArticle.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      articles,
      pagination: { page, pageSize, totalCount, totalPages },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error listing articles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.admin);
  if (rateLimitResponse) return rateLimitResponse;

  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => null);
    const parsed = createArticleSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Invalid data";
      return NextResponse.json(
        { success: false, error: firstError },
        { status: 400 }
      );
    }

    const { title, excerpt, imageUrl, externalUrl, status, publishedAt } = parsed.data;

    let slug = slugify(title);
    const existing = await prisma.newsArticle.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const article = await prisma.newsArticle.create({
      data: {
        title,
        slug,
        excerpt: excerpt || null,
        imageUrl: imageUrl || null,
        externalUrl: externalUrl || null,
        status: status ?? "draft",
        publishedAt: publishedAt ? new Date(publishedAt) : (status === "published" ? new Date() : null),
      },
    });

    return NextResponse.json({ success: true, article }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error creating article" },
      { status: 500 }
    );
  }
}
