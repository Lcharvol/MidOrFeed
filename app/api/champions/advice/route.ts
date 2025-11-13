import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";

const createAdviceSchema = z.object({
  championId: z.string().min(1),
  content: z.string().trim().min(10).max(1000),
  displayName: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .optional(),
});

const getLimit = (value: string | null) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 30;
  }
  return Math.max(1, Math.min(parsed, 100));
};

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
  viewerVote: number | null
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
  viewerVote: viewerVote === null ? null : (viewerVote as -1 | 0 | 1),
  language: null,
  patchVersion: null,
});

export const GET = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const championId = searchParams.get("championId")?.trim();

  if (!championId) {
    return NextResponse.json(
      { success: false, error: "championId requis" },
      { status: 400 }
    );
  }

  const viewer = await getAuthenticatedUser(request);
  const limit = getLimit(searchParams.get("limit"));

  const advices = await prisma.championAdvice.findMany({
    where: { championId },
    orderBy: [
      { score: "desc" },
      { createdAt: "desc" },
    ],
    take: limit,
    include: {
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  let viewerVotes: Record<string, number> = {};

  if (viewer && advices.length > 0) {
    const votes = await prisma.championAdviceVote.findMany({
      where: {
        userId: viewer.id,
        adviceId: {
          in: advices.map((advice) => advice.id),
        },
      },
      select: {
        adviceId: true,
        value: true,
      },
    });

    viewerVotes = votes.reduce<Record<string, number>>((accumulator, vote) => {
      accumulator[vote.adviceId] = vote.value;
      return accumulator;
    }, {});
  }

  const payload = advices.map((advice) =>
    buildAdvicePayload(advice, viewerVotes[advice.id] ?? null)
  );

  return NextResponse.json({
    success: true,
    data: {
      championId,
      advices: payload.map((entry, index) => ({
        ...entry,
        canDelete: Boolean(viewer) && advices[index].authorId === viewer?.id,
      })),
    },
  });
};

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json().catch(() => null);

    const parsed = createAdviceSchema.safeParse(body);

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

    const { championId, content, displayName } = parsed.data;

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true },
    });

    const authorName =
      displayName ?? userRecord?.name ?? userRecord?.email ?? user.email ?? "Invité";

    const advice = await prisma.championAdvice.create({
      data: {
        championId,
        content,
        authorId: user.id,
        authorName,
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

    return NextResponse.json({
      success: true,
    data: {
      advice: {
        ...buildAdvicePayload(advice, null),
        canDelete: true,
      },
    },
    });
  } catch (error) {
    console.error("[CHAMPION-ADVICE] POST error", error);
    return NextResponse.json(
      {
        success: false,
        error: "Impossible d'enregistrer le conseil pour le moment.",
      },
      { status: 500 }
    );
  }
};


