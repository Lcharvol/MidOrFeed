import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const articles = await prisma.newsArticle.findMany({
      where: {
        status: "published",
        publishedAt: { not: null },
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
    });

    return NextResponse.json(
      { success: true, data: articles },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Error fetching news articles" },
      { status: 500 }
    );
  }
}
