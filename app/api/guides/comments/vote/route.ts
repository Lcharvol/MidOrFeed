import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";

const voteSchema = z.object({
  commentId: z.string(),
  value: z.number().int().min(-1).max(1),
});

// POST /api/guides/comments/vote - Vote on a comment
export const POST = async (request: NextRequest) => {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentification requise" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = voteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Données invalides" },
        { status: 400 }
      );
    }

    const { commentId, value } = parsed.data;

    // Verify comment exists
    const comment = await prisma.championGuideComment.findUnique({
      where: { id: commentId },
      select: { id: true, score: true, upvotes: true, downvotes: true },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: "Commentaire non trouvé" },
        { status: 404 }
      );
    }

    // Use transaction to update vote and counters atomically
    const result = await prisma.$transaction(async (tx) => {
      const existingVote = await tx.championGuideCommentVote.findUnique({
        where: {
          commentId_userId: { commentId, userId: user.id },
        },
      });

      const oldValue = existingVote?.value ?? 0;
      const newValue = value;

      // Calculate deltas
      let scoreDelta = 0;
      let upvotesDelta = 0;
      let downvotesDelta = 0;

      if (oldValue !== newValue) {
        // Remove old vote effects
        if (oldValue === 1) {
          scoreDelta -= 1;
          upvotesDelta -= 1;
        } else if (oldValue === -1) {
          scoreDelta += 1;
          downvotesDelta -= 1;
        }

        // Add new vote effects
        if (newValue === 1) {
          scoreDelta += 1;
          upvotesDelta += 1;
        } else if (newValue === -1) {
          scoreDelta -= 1;
          downvotesDelta += 1;
        }
      }

      // Update or remove vote record
      if (newValue === 0) {
        if (existingVote) {
          await tx.championGuideCommentVote.delete({
            where: { id: existingVote.id },
          });
        }
      } else {
        await tx.championGuideCommentVote.upsert({
          where: {
            commentId_userId: { commentId, userId: user.id },
          },
          create: {
            commentId,
            userId: user.id,
            value: newValue,
          },
          update: {
            value: newValue,
          },
        });
      }

      // Update comment counters
      if (scoreDelta !== 0 || upvotesDelta !== 0 || downvotesDelta !== 0) {
        await tx.championGuideComment.update({
          where: { id: commentId },
          data: {
            score: { increment: scoreDelta },
            upvotes: { increment: upvotesDelta },
            downvotes: { increment: downvotesDelta },
          },
        });
      }

      // Get updated comment
      return tx.championGuideComment.findUnique({
        where: { id: commentId },
        select: { score: true, upvotes: true, downvotes: true },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        commentId,
        viewerVote: value as -1 | 0 | 1,
        score: result?.score ?? 0,
        upvotes: result?.upvotes ?? 0,
        downvotes: result?.downvotes ?? 0,
      },
    });
  } catch (error) {
    console.error("[GUIDES] POST comment vote error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du vote" },
      { status: 500 }
    );
  }
};
