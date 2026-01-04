import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { requireCsrf } from "@/lib/csrf";
import { createLogger } from "@/lib/logger";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import type {
  GuideSummary,
  GuideRole,
  GuideStatus,
} from "@/types/guides";

const logger = createLogger("guides");

// Validation schemas
const itemBuildSchema = z.object({
  starter: z.array(z.string()).optional().default([]),
  core: z.array(z.string()).optional().default([]),
  situational: z.array(z.string()).optional().default([]),
  boots: z.array(z.string()).optional().default([]),
});

const skillOrderSchema = z.object({
  levels: z.record(z.string(), z.enum(["Q", "W", "E", "R"])).optional().default({}),
  maxOrder: z.array(z.enum(["Q", "W", "E"])).optional().default([]),
});

const runeConfigSchema = z.object({
  primary: z.object({
    tree: z.string(),
    keystone: z.string(),
    slots: z.array(z.string()),
  }),
  secondary: z.object({
    tree: z.string(),
    slots: z.array(z.string()),
  }),
  shards: z.tuple([z.string(), z.string(), z.string()]),
}).optional();

const matchupEntrySchema = z.object({
  championId: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  notes: z.string().max(500).optional(),
});

const createGuideSchema = z.object({
  championId: z.string().min(1),
  title: z.string().trim().min(3).max(100),
  introduction: z.string().trim().max(2000).optional(),
  itemBuild: itemBuildSchema.optional(),
  skillOrder: skillOrderSchema.optional(),
  runeConfig: runeConfigSchema.optional(),
  summonerSpells: z.tuple([z.number(), z.number()]).optional(),
  earlyGameTips: z.string().trim().max(2000).optional(),
  midGameTips: z.string().trim().max(2000).optional(),
  lateGameTips: z.string().trim().max(2000).optional(),
  goodMatchups: z.array(matchupEntrySchema).max(10).optional(),
  badMatchups: z.array(matchupEntrySchema).max(10).optional(),
  strengths: z.array(z.string().max(200)).max(5).optional(),
  weaknesses: z.array(z.string().max(200)).max(5).optional(),
  patchVersion: z.string().max(20).optional(),
  role: z.enum(["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"]).optional(),
  status: z.enum(["draft", "published"]).optional().default("published"),
});

const getLimit = (value: string | null): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 20;
  return Math.max(1, Math.min(parsed, 50));
};

const getOffset = (value: string | null): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed);
};

type PrismaGuide = {
  id: string;
  championId: string;
  authorId: string | null;
  authorName: string | null;
  title: string;
  introduction: string | null;
  role: string | null;
  patchVersion: string | null;
  score: number;
  upvotes: number;
  downvotes: number;
  viewCount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  author?: { id: string; name: string | null } | null;
};

const buildGuideSummary = (
  guide: PrismaGuide,
  viewerVote: number | null
): GuideSummary => ({
  id: guide.id,
  championId: guide.championId,
  authorId: guide.authorId,
  authorName: guide.authorName ?? guide.author?.name ?? null,
  title: guide.title,
  introduction: guide.introduction,
  role: guide.role as GuideRole | null,
  patchVersion: guide.patchVersion,
  score: guide.score,
  upvotes: guide.upvotes,
  downvotes: guide.downvotes,
  viewCount: guide.viewCount,
  status: guide.status as GuideStatus,
  createdAt: guide.createdAt.toISOString(),
  updatedAt: guide.updatedAt.toISOString(),
  viewerVote: viewerVote as -1 | 0 | 1 | null,
});

// GET /api/guides - List guides
export const GET = async (request: NextRequest) => {
  // Rate limiting
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(request.url);
    const championId = searchParams.get("championId")?.trim();
    const role = searchParams.get("role")?.trim();
    const authorId = searchParams.get("authorId")?.trim();
    const status = searchParams.get("status")?.trim() || "published";
    const sort = searchParams.get("sort") || "popular";
    const limit = getLimit(searchParams.get("limit"));
    const offset = getOffset(searchParams.get("offset"));

    const viewer = await getAuthenticatedUser(request);

    // Build where clause
    const where: Record<string, unknown> = {};

    if (championId) where.championId = championId;
    if (role) where.role = role;
    if (authorId) where.authorId = authorId;

    // Only show published guides unless viewing own guides
    if (authorId && viewer?.id === authorId) {
      // Author can see their own drafts
      if (status) where.status = status;
    } else {
      where.status = "published";
    }

    // Build orderBy
    type OrderByItem = { score?: "desc" | "asc"; createdAt?: "desc" | "asc"; viewCount?: "desc" | "asc" };
    let orderBy: OrderByItem[] = [{ score: "desc" }, { createdAt: "desc" }];
    if (sort === "recent") {
      orderBy = [{ createdAt: "desc" }];
    } else if (sort === "views") {
      orderBy = [{ viewCount: "desc" }, { createdAt: "desc" }];
    }

    // Fetch guides
    const [guides, total] = await Promise.all([
      prisma.championGuide.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          author: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.championGuide.count({ where }),
    ]);

    // Get viewer votes if authenticated
    let viewerVotes: Record<string, number> = {};
    if (viewer && guides.length > 0) {
      const votes = await prisma.championGuideVote.findMany({
        where: {
          userId: viewer.id,
          guideId: { in: guides.map((g) => g.id) },
        },
        select: { guideId: true, value: true },
      });
      viewerVotes = votes.reduce<Record<string, number>>((acc, v) => {
        acc[v.guideId] = v.value;
        return acc;
      }, {});
    }

    const payload = guides.map((guide) =>
      buildGuideSummary(guide, viewerVotes[guide.id] ?? null)
    );

    return NextResponse.json({
      success: true,
      data: {
        guides: payload,
        total,
        hasMore: offset + guides.length < total,
      },
    });
  } catch (error) {
    logger.error("GET error:", error as Error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des guides" },
      { status: 500 }
    );
  }
};

// POST /api/guides - Create guide
export const POST = async (request: NextRequest) => {
  // CSRF validation
  const csrfError = await requireCsrf(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json().catch(() => null);
    const parsed = createGuideSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentification requise" },
        { status: 401 }
      );
    }

    const data = parsed.data;

    // Get user's display name
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true },
    });
    const authorName = userRecord?.name ?? userRecord?.email ?? "Anonyme";

    // Create guide
    const guide = await prisma.championGuide.create({
      data: {
        championId: data.championId,
        authorId: user.id,
        authorName,
        title: data.title,
        introduction: data.introduction || null,
        itemBuild: data.itemBuild ?? undefined,
        skillOrder: data.skillOrder ?? undefined,
        runeConfig: data.runeConfig ?? undefined,
        summonerSpells: data.summonerSpells ?? undefined,
        earlyGameTips: data.earlyGameTips || null,
        midGameTips: data.midGameTips || null,
        lateGameTips: data.lateGameTips || null,
        goodMatchups: data.goodMatchups ?? undefined,
        badMatchups: data.badMatchups ?? undefined,
        strengths: data.strengths ?? undefined,
        weaknesses: data.weaknesses ?? undefined,
        patchVersion: data.patchVersion || null,
        role: data.role || null,
        status: data.status,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        guide: buildGuideSummary(guide, null),
      },
    });
  } catch (error) {
    logger.error("POST error:", error as Error);
    return NextResponse.json(
      { success: false, error: "Impossible de créer le guide" },
      { status: 500 }
    );
  }
};
