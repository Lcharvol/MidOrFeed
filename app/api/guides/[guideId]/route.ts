import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import type {
  ChampionGuide,
  ItemBuildConfig,
  SkillOrderConfig,
  RuneConfig,
  MatchupEntry,
  GuideRole,
  GuideStatus,
} from "@/types/guides";

// Validation schema for updates
const updateGuideSchema = z.object({
  title: z.string().trim().min(3).max(100).optional(),
  introduction: z.string().trim().max(2000).optional().nullable(),
  itemBuild: z.object({
    starter: z.array(z.string()).optional().default([]),
    core: z.array(z.string()).optional().default([]),
    situational: z.array(z.string()).optional().default([]),
    boots: z.array(z.string()).optional().default([]),
  }).optional().nullable(),
  skillOrder: z.object({
    levels: z.record(z.string(), z.enum(["Q", "W", "E", "R"])).optional().default({}),
    maxOrder: z.array(z.enum(["Q", "W", "E"])).optional().default([]),
  }).optional().nullable(),
  runeConfig: z.object({
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
  }).optional().nullable(),
  summonerSpells: z.tuple([z.number(), z.number()]).optional().nullable(),
  earlyGameTips: z.string().trim().max(2000).optional().nullable(),
  midGameTips: z.string().trim().max(2000).optional().nullable(),
  lateGameTips: z.string().trim().max(2000).optional().nullable(),
  goodMatchups: z.array(z.object({
    championId: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    notes: z.string().max(500).optional(),
  })).max(10).optional().nullable(),
  badMatchups: z.array(z.object({
    championId: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    notes: z.string().max(500).optional(),
  })).max(10).optional().nullable(),
  strengths: z.array(z.string().max(200)).max(5).optional().nullable(),
  weaknesses: z.array(z.string().max(200)).max(5).optional().nullable(),
  patchVersion: z.string().max(20).optional().nullable(),
  role: z.enum(["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"]).optional().nullable(),
  status: z.enum(["draft", "published"]).optional(),
});

type RouteContext = { params: Promise<{ guideId: string }> };

// GET /api/guides/[guideId] - Get single guide
export const GET = async (request: NextRequest, context: RouteContext) => {
  try {
    const { guideId } = await context.params;

    if (!guideId) {
      return NextResponse.json(
        { success: false, error: "ID du guide requis" },
        { status: 400 }
      );
    }

    const viewer = await getAuthenticatedUser(request);

    const guide = await prisma.championGuide.findUnique({
      where: { id: guideId },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });

    if (!guide) {
      return NextResponse.json(
        { success: false, error: "Guide non trouvé" },
        { status: 404 }
      );
    }

    // Check access for draft guides
    if (guide.status === "draft" && guide.authorId !== viewer?.id) {
      return NextResponse.json(
        { success: false, error: "Guide non trouvé" },
        { status: 404 }
      );
    }

    // Increment view count (fire and forget)
    prisma.championGuide.update({
      where: { id: guideId },
      data: { viewCount: { increment: 1 } },
    }).catch(() => { /* ignore errors */ });

    // Get viewer's vote
    let viewerVote: number | null = null;
    if (viewer) {
      const vote = await prisma.championGuideVote.findUnique({
        where: {
          guideId_userId: { guideId, userId: viewer.id },
        },
        select: { value: true },
      });
      viewerVote = vote?.value ?? null;
    }

    const payload: ChampionGuide = {
      id: guide.id,
      championId: guide.championId,
      authorId: guide.authorId,
      authorName: guide.authorName ?? guide.author?.name ?? null,
      title: guide.title,
      introduction: guide.introduction,
      itemBuild: guide.itemBuild as ItemBuildConfig | null,
      skillOrder: guide.skillOrder as SkillOrderConfig | null,
      runeConfig: guide.runeConfig as RuneConfig | null,
      summonerSpells: guide.summonerSpells as [number, number] | null,
      earlyGameTips: guide.earlyGameTips,
      midGameTips: guide.midGameTips,
      lateGameTips: guide.lateGameTips,
      goodMatchups: guide.goodMatchups as MatchupEntry[] | null,
      badMatchups: guide.badMatchups as MatchupEntry[] | null,
      strengths: guide.strengths as string[] | null,
      weaknesses: guide.weaknesses as string[] | null,
      patchVersion: guide.patchVersion,
      role: guide.role as GuideRole | null,
      score: guide.score,
      upvotes: guide.upvotes,
      downvotes: guide.downvotes,
      viewCount: guide.viewCount,
      status: guide.status as GuideStatus,
      createdAt: guide.createdAt.toISOString(),
      updatedAt: guide.updatedAt.toISOString(),
      viewerVote: viewerVote as -1 | 0 | 1 | null,
      canEdit: viewer?.id === guide.authorId,
      canDelete: viewer?.id === guide.authorId || viewer?.role === "admin",
    };

    return NextResponse.json({
      success: true,
      data: { guide: payload },
    });
  } catch (error) {
    console.error("[GUIDES] GET [guideId] error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération du guide" },
      { status: 500 }
    );
  }
};

// PUT /api/guides/[guideId] - Update guide
export const PUT = async (request: NextRequest, context: RouteContext) => {
  try {
    const { guideId } = await context.params;

    if (!guideId) {
      return NextResponse.json(
        { success: false, error: "ID du guide requis" },
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

    // Check guide exists and user is author
    const existing = await prisma.championGuide.findUnique({
      where: { id: guideId },
      select: { authorId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Guide non trouvé" },
        { status: 404 }
      );
    }

    if (existing.authorId !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = updateGuideSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.introduction !== undefined) updateData.introduction = data.introduction;
    if (data.itemBuild !== undefined) updateData.itemBuild = data.itemBuild;
    if (data.skillOrder !== undefined) updateData.skillOrder = data.skillOrder;
    if (data.runeConfig !== undefined) updateData.runeConfig = data.runeConfig;
    if (data.summonerSpells !== undefined) updateData.summonerSpells = data.summonerSpells;
    if (data.earlyGameTips !== undefined) updateData.earlyGameTips = data.earlyGameTips;
    if (data.midGameTips !== undefined) updateData.midGameTips = data.midGameTips;
    if (data.lateGameTips !== undefined) updateData.lateGameTips = data.lateGameTips;
    if (data.goodMatchups !== undefined) updateData.goodMatchups = data.goodMatchups;
    if (data.badMatchups !== undefined) updateData.badMatchups = data.badMatchups;
    if (data.strengths !== undefined) updateData.strengths = data.strengths;
    if (data.weaknesses !== undefined) updateData.weaknesses = data.weaknesses;
    if (data.patchVersion !== undefined) updateData.patchVersion = data.patchVersion;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.status !== undefined) updateData.status = data.status;

    const guide = await prisma.championGuide.update({
      where: { id: guideId },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        guide: {
          id: guide.id,
          title: guide.title,
          updatedAt: guide.updatedAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("[GUIDES] PUT [guideId] error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la mise à jour du guide" },
      { status: 500 }
    );
  }
};

// DELETE /api/guides/[guideId] - Delete guide
export const DELETE = async (request: NextRequest, context: RouteContext) => {
  try {
    const { guideId } = await context.params;

    if (!guideId) {
      return NextResponse.json(
        { success: false, error: "ID du guide requis" },
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

    const existing = await prisma.championGuide.findUnique({
      where: { id: guideId },
      select: { authorId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Guide non trouvé" },
        { status: 404 }
      );
    }

    if (existing.authorId !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 403 }
      );
    }

    await prisma.championGuide.delete({
      where: { id: guideId },
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error("[GUIDES] DELETE [guideId] error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la suppression du guide" },
      { status: 500 }
    );
  }
};
