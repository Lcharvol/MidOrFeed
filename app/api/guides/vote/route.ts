import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";

const voteSchema = z.object({
  guideId: z.string().min(1),
  value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
});

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json().catch(() => null);
    const parsed = voteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Données invalides" },
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

    const { guideId, value } = parsed.data;

    // Check guide exists
    const guideExists = await prisma.championGuide.findUnique({
      where: { id: guideId },
      select: { id: true, status: true },
    });

    if (!guideExists || guideExists.status !== "published") {
      return NextResponse.json(
        { success: false, error: "Guide introuvable" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get existing vote
      const existingVote = await tx.championGuideVote.findUnique({
        where: {
          guideId_userId: { guideId, userId: user.id },
        },
      });

      const existingValue = existingVote?.value ?? 0;
      // If clicking same value, toggle off (set to 0)
      const desiredValue = value === existingValue ? 0 : value;

      // If no change needed
      if (!existingVote && desiredValue === 0) {
        const guide = await tx.championGuide.findUnique({
          where: { id: guideId },
          select: { score: true, upvotes: true, downvotes: true },
        });
        return { guide, viewerVote: null as -1 | 0 | 1 | null };
      }

      // Calculate deltas
      const deltaScore = desiredValue - existingValue;
      const deltaUpvotes = (desiredValue === 1 ? 1 : 0) - (existingValue === 1 ? 1 : 0);
      const deltaDownvotes = (desiredValue === -1 ? 1 : 0) - (existingValue === -1 ? 1 : 0);

      // Update or delete vote record
      if (existingVote) {
        if (desiredValue === 0) {
          await tx.championGuideVote.delete({
            where: { guideId_userId: { guideId, userId: user.id } },
          });
        } else {
          await tx.championGuideVote.update({
            where: { id: existingVote.id },
            data: { value: desiredValue },
          });
        }
      } else if (desiredValue !== 0) {
        await tx.championGuideVote.create({
          data: { guideId, userId: user.id, value: desiredValue },
        });
      }

      // Update guide counters
      const updatedGuide = await tx.championGuide.update({
        where: { id: guideId },
        data: {
          score: { increment: deltaScore },
          upvotes: { increment: deltaUpvotes },
          downvotes: { increment: deltaDownvotes },
        },
        select: { score: true, upvotes: true, downvotes: true },
      });

      return {
        guide: updatedGuide,
        viewerVote: (desiredValue === 0 ? null : desiredValue) as -1 | 0 | 1 | null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        guideId,
        score: result.guide?.score ?? 0,
        upvotes: result.guide?.upvotes ?? 0,
        downvotes: result.guide?.downvotes ?? 0,
        viewerVote: result.viewerVote,
      },
    });
  } catch (error) {
    console.error("[GUIDES] Vote error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du vote" },
      { status: 500 }
    );
  }
};
