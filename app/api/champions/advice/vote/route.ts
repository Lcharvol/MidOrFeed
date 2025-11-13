import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";

const voteSchema = z.object({
  adviceId: z.string().min(1),
  value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
});

const buildAdvicePayload = (
  advice: {
    id: string;
    championId: string;
    authorId: string | null;
    authorName: string | null;
    content: string;
    score: number;
    upvotes: number;
    downvotes: number;
    createdAt: Date;
    updatedAt: Date;
    author?: {
      id: string;
      name: string | null;
    } | null;
  },
  viewerVote: -1 | 0 | 1 | null
) => ({
  id: advice.id,
  championId: advice.championId,
  authorId: advice.authorId,
  authorName: advice.authorName ?? advice.author?.name ?? null,
  content: advice.content,
  score: advice.score,
  upvotes: advice.upvotes,
  downvotes: advice.downvotes,
  createdAt: advice.createdAt.toISOString(),
  updatedAt: advice.updatedAt.toISOString(),
  viewerVote: viewerVote === null || viewerVote === 0 ? null : viewerVote,
  language: null,
  patchVersion: null,
});

export const POST = async (request: NextRequest) => {
  const body = await request.json();
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

  const { adviceId, value } = parsed.data;

  const adviceExists = await prisma.championAdvice.findUnique({
    where: { id: adviceId },
    select: { id: true },
  });

  if (!adviceExists) {
    return NextResponse.json(
      { success: false, error: "Conseil introuvable" },
      { status: 404 }
    );
  }

  const result = await prisma.$transaction(async (transaction) => {
    const existingVote = await transaction.championAdviceVote.findUnique({
      where: {
        adviceId_userId: {
          adviceId,
          userId: user.id,
        },
      },
    });

    const existingValue = existingVote?.value ?? 0;
    const desiredValue = value === existingValue ? 0 : value;

    if (!existingVote && desiredValue === 0) {
      const currentAdvice = await transaction.championAdvice.findUnique({
        where: { id: adviceId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      if (!currentAdvice) {
        throw new Error("Conseil introuvable");
      }
      return { advice: currentAdvice, viewerVote: null as -1 | 0 | 1 | null };
    }

    const deltaScore = desiredValue - existingValue;
    const deltaUpvotes =
      (desiredValue === 1 ? 1 : 0) - (existingValue === 1 ? 1 : 0);
    const deltaDownvotes =
      (desiredValue === -1 ? 1 : 0) - (existingValue === -1 ? 1 : 0);

    if (existingVote) {
      if (desiredValue === 0) {
        await transaction.championAdviceVote.delete({
          where: {
            adviceId_userId: {
              adviceId,
              userId: user.id,
            },
          },
        });
      } else {
        await transaction.championAdviceVote.update({
          where: { id: existingVote.id },
          data: { value: desiredValue },
        });
      }
    } else if (desiredValue !== 0) {
      await transaction.championAdviceVote.create({
        data: {
          adviceId,
          userId: user.id,
          value: desiredValue,
        },
      });
    }

    const updatedAdvice = await transaction.championAdvice.update({
      where: { id: adviceId },
      data: {
        score: { increment: deltaScore },
        upvotes: { increment: deltaUpvotes },
        downvotes: { increment: deltaDownvotes },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return { advice: updatedAdvice, viewerVote: desiredValue };
  });

  return NextResponse.json({
    success: true,
    data: {
      advice: buildAdvicePayload(result.advice, result.viewerVote),
    },
  });
};


