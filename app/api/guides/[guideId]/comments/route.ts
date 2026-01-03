import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { requireCsrf } from "@/lib/csrf";
import { createLogger } from "@/lib/logger";
import type { GuideComment } from "@/types/guides";

const logger = createLogger("guide-comments");

const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  parentId: z.string().optional(),
});

type RouteContext = { params: Promise<{ guideId: string }> };

// Format comment for response
const formatComment = (
  comment: {
    id: string;
    guideId: string;
    authorId: string | null;
    authorName: string | null;
    content: string;
    score: number;
    upvotes: number;
    downvotes: number;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
    author?: { id: string; name: string | null } | null;
    replies?: Array<{
      id: string;
      guideId: string;
      authorId: string | null;
      authorName: string | null;
      content: string;
      score: number;
      upvotes: number;
      downvotes: number;
      parentId: string | null;
      createdAt: Date;
      updatedAt: Date;
      author?: { id: string; name: string | null } | null;
    }>;
  },
  viewerId: string | null,
  viewerVotes: Map<string, number>,
  isAdmin: boolean
): GuideComment => ({
  id: comment.id,
  guideId: comment.guideId,
  authorId: comment.authorId,
  authorName: comment.authorName ?? comment.author?.name ?? null,
  content: comment.content,
  score: comment.score,
  upvotes: comment.upvotes,
  downvotes: comment.downvotes,
  parentId: comment.parentId,
  createdAt: comment.createdAt.toISOString(),
  updatedAt: comment.updatedAt.toISOString(),
  viewerVote: (viewerVotes.get(comment.id) as -1 | 0 | 1) ?? null,
  canEdit: viewerId === comment.authorId,
  canDelete: viewerId === comment.authorId || isAdmin,
  replies: comment.replies?.map((reply) =>
    formatComment(reply, viewerId, viewerVotes, isAdmin)
  ),
});

// GET /api/guides/[guideId]/comments - Get comments
export const GET = async (request: NextRequest, context: RouteContext) => {
  try {
    const { guideId } = await context.params;

    if (!guideId) {
      return NextResponse.json(
        { success: false, error: "ID du guide requis" },
        { status: 400 }
      );
    }

    // Check guide exists
    const guide = await prisma.championGuide.findUnique({
      where: { id: guideId },
      select: { id: true, status: true, authorId: true },
    });

    if (!guide) {
      return NextResponse.json(
        { success: false, error: "Guide non trouvé" },
        { status: 404 }
      );
    }

    const viewer = await getAuthenticatedUser(request);

    // Check access for draft guides
    if (guide.status === "draft" && guide.authorId !== viewer?.id) {
      return NextResponse.json(
        { success: false, error: "Guide non trouvé" },
        { status: 404 }
      );
    }

    // Get top-level comments with replies
    const comments = await prisma.championGuideComment.findMany({
      where: {
        guideId,
        parentId: null,
      },
      include: {
        author: { select: { id: true, name: true } },
        replies: {
          include: {
            author: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { score: "desc" },
    });

    // Get viewer's votes on comments
    const viewerVotes = new Map<string, number>();
    if (viewer) {
      const commentIds = comments.flatMap((c) => [
        c.id,
        ...c.replies.map((r) => r.id),
      ]);

      const votes = await prisma.championGuideCommentVote.findMany({
        where: {
          commentId: { in: commentIds },
          userId: viewer.id,
        },
        select: { commentId: true, value: true },
      });

      votes.forEach((v) => viewerVotes.set(v.commentId, v.value));
    }

    const isAdmin = viewer?.role === "admin";
    const formattedComments = comments.map((c) =>
      formatComment(c, viewer?.id ?? null, viewerVotes, isAdmin)
    );

    const total = await prisma.championGuideComment.count({
      where: { guideId },
    });

    return NextResponse.json({
      success: true,
      data: {
        comments: formattedComments,
        total,
      },
    });
  } catch (error) {
    logger.error("GET comments error:", error as Error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des commentaires" },
      { status: 500 }
    );
  }
};

// POST /api/guides/[guideId]/comments - Create comment
export const POST = async (request: NextRequest, context: RouteContext) => {
  // CSRF validation
  const csrfError = await requireCsrf(request);
  if (csrfError) return csrfError;

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

    // Check guide exists
    const guide = await prisma.championGuide.findUnique({
      where: { id: guideId },
      select: { id: true, status: true, authorId: true },
    });

    if (!guide) {
      return NextResponse.json(
        { success: false, error: "Guide non trouvé" },
        { status: 404 }
      );
    }

    // Draft guides can only be commented by author
    if (guide.status === "draft" && guide.authorId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Guide non trouvé" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = createCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, parentId } = parsed.data;

    // Verify parent comment if provided
    if (parentId) {
      const parent = await prisma.championGuideComment.findUnique({
        where: { id: parentId },
        select: { guideId: true, parentId: true },
      });

      if (!parent || parent.guideId !== guideId) {
        return NextResponse.json(
          { success: false, error: "Commentaire parent invalide" },
          { status: 400 }
        );
      }

      // Only allow one level of nesting
      if (parent.parentId !== null) {
        return NextResponse.json(
          { success: false, error: "Réponse imbriquée non autorisée" },
          { status: 400 }
        );
      }
    }

    // Get user name from database
    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true },
    });

    const comment = await prisma.championGuideComment.create({
      data: {
        guideId,
        authorId: user.id,
        authorName: userInfo?.name ?? null,
        content,
        parentId: parentId ?? null,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    const formatted: GuideComment = {
      id: comment.id,
      guideId: comment.guideId,
      authorId: comment.authorId,
      authorName: comment.authorName ?? comment.author?.name ?? null,
      content: comment.content,
      score: comment.score,
      upvotes: comment.upvotes,
      downvotes: comment.downvotes,
      parentId: comment.parentId,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      viewerVote: null,
      canEdit: true,
      canDelete: true,
    };

    return NextResponse.json({
      success: true,
      data: { comment: formatted },
    });
  } catch (error) {
    logger.error("POST comment error:", error as Error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'ajout du commentaire" },
      { status: 500 }
    );
  }
};
