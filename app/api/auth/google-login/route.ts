import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const oauthClient = GOOGLE_CLIENT_ID
  ? new OAuth2Client(GOOGLE_CLIENT_ID)
  : null;

type UserWithLeagueAccount = User & {
  leagueAccount: {
    id: string;
    puuid: string;
    riotRegion: string | null;
    riotGameName: string | null;
    riotTagLine: string | null;
    profileIconId: number | null;
  } | null;
};

const serializeUser = (user: UserWithLeagueAccount) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  subscriptionTier: user.subscriptionTier,
  subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString?.() ?? null,
  dailyAnalysesUsed: user.dailyAnalysesUsed,
  lastDailyReset: user.lastDailyReset?.toISOString?.() ?? null,
  leagueAccount: user.leagueAccount
    ? {
        id: user.leagueAccount.id,
        puuid: user.leagueAccount.puuid,
        riotRegion: user.leagueAccount.riotRegion,
        riotGameName: user.leagueAccount.riotGameName,
        riotTagLine: user.leagueAccount.riotTagLine,
        profileIconId: user.leagueAccount.profileIconId,
      }
    : null,
});

export async function POST(request: Request) {
  if (!oauthClient || !GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { success: false, error: "Google OAuth non configuré" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const token = body?.token;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Jeton Google manquant" },
        { status: 400 }
      );
    }

    const ticket = await oauthClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      return NextResponse.json(
        { success: false, error: "Impossible de valider l'adresse e-mail" },
        { status: 400 }
      );
    }

    const email = payload.email;
    const name = payload.name ?? payload.given_name ?? email.split("@")[0];

    let user = await prisma.user.findUnique({
      where: { email },
      include: { leagueAccount: true },
    });

    if (!user) {
      const randomPassword = randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
        },
        include: { leagueAccount: true },
      });
    }

    return NextResponse.json({
      success: true,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("[GOOGLE-AUTH] Error", error);
    return NextResponse.json(
      { success: false, error: "Authentification Google impossible" },
      { status: 500 }
    );
  }
}
