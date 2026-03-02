import { randomBytes } from "crypto";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { ShardedLeagueAccounts } from "@/lib/prisma-sharded-accounts";
import { generateToken, AUTH_COOKIE_NAME } from "@/lib/jwt";
import { riotApiRequest } from "@/lib/riot-api";
import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
import { serializeUser } from "@/lib/api-helpers";
import { buildSiteUrl } from "@/constants/site";

import type { UserForSerialization } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle Riot-side errors (user denied, etc.)
  if (error) {
    logger.warn("RSO authorization error", { error });
    return NextResponse.redirect(buildSiteUrl("/login?error=riot_denied"));
  }

  if (!code || !state) {
    return NextResponse.redirect(buildSiteUrl("/login?error=riot_error"));
  }

  // Validate state against cookie
  const stateCookie = request.cookies.get("rso-state")?.value;
  if (!stateCookie || stateCookie !== state) {
    logger.warn("RSO state mismatch", {
      hasStateCookie: !!stateCookie,
      stateMatch: stateCookie === state,
    });
    return NextResponse.redirect(buildSiteUrl("/login?error=riot_error"));
  }

  const env = getEnv();
  const clientId = env.RIOT_RSO_CLIENT_ID;
  const clientSecret = env.RIOT_RSO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      buildSiteUrl("/login?error=riot_not_configured")
    );
  }

  const redirectUri = buildSiteUrl("/api/auth/riot/callback");

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://auth.riotgames.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      logger.error("RSO token exchange failed", undefined, {
        status: tokenResponse.status,
        body: errorBody,
      });
      return NextResponse.redirect(buildSiteUrl("/login?error=riot_error"));
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      token_type: string;
    };

    // Fetch userinfo to get PUUID (sub claim)
    const userinfoResponse = await fetch(
      "https://auth.riotgames.com/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (!userinfoResponse.ok) {
      logger.error("RSO userinfo fetch failed", undefined, {
        status: userinfoResponse.status,
      });
      return NextResponse.redirect(buildSiteUrl("/login?error=riot_error"));
    }

    const userinfo = (await userinfoResponse.json()) as {
      sub: string; // PUUID
      cpid?: string; // optional player ID
    };

    const puuid = userinfo.sub;
    if (!puuid) {
      logger.error("RSO userinfo missing sub (PUUID)");
      return NextResponse.redirect(buildSiteUrl("/login?error=riot_error"));
    }

    // Fetch gameName/tagLine from Riot Account API
    let gameName: string | null = null;
    let tagLine: string | null = null;
    let region = "euw1"; // default region

    try {
      const accountUrl = `https://europe.api.riotgames.com/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`;
      const { data: accountData } = await riotApiRequest<{
        puuid: string;
        gameName?: string;
        tagLine?: string;
      }>(accountUrl, { useCache: false });

      if (accountData) {
        gameName = accountData.gameName ?? null;
        tagLine = accountData.tagLine ?? null;
      }
    } catch (err) {
      // Non-blocking: user can still log in without gameName/tagLine
      logger.warn("RSO: failed to fetch Riot account data", {
        error: toError(err).message,
        puuid: puuid.slice(0, 8) + "...",
      });
    }

    // Upsert user: match by riotPuuid
    let user = await prisma.user.findFirst({
      where: { riotPuuid: puuid },
      include: { leagueAccount: true },
    });

    if (!user) {
      // Create new user with placeholder email (RSO doesn't provide email)
      const placeholderEmail = `riot_${puuid.slice(0, 12)}@midorfeed.local`;
      const randomPassword = randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 12);

      user = await prisma.user.create({
        data: {
          email: placeholderEmail,
          name: gameName
            ? `${gameName}${tagLine ? `#${tagLine}` : ""}`
            : `Riot User`,
          password: hashedPassword,
          riotPuuid: puuid,
          riotRegion: region,
          lastLoginAt: new Date(),
        },
        include: { leagueAccount: true },
      });
    } else {
      // Update last login
      user = await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
        include: { leagueAccount: true },
      });
    }

    // Auto-link Riot account if gameName is available
    if (gameName && puuid) {
      try {
        const mainAccount = await prisma.leagueOfLegendsAccount.upsert({
          where: { puuid },
          create: {
            puuid,
            riotRegion: region,
            riotGameName: gameName,
            riotTagLine: tagLine,
          },
          update: {
            riotRegion: region,
            riotGameName: gameName,
            riotTagLine: tagLine,
          },
        });

        await ShardedLeagueAccounts.upsert({
          puuid,
          riotRegion: region,
          riotGameName: gameName,
          riotTagLine: tagLine,
        });

        // Link account to user if not already linked
        if (user.leagueAccountId !== mainAccount.id) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              leagueAccountId: mainAccount.id,
              riotPuuid: puuid,
              riotRegion: region,
            },
            include: { leagueAccount: true },
          });
        }
      } catch (err) {
        // Non-blocking: user can still log in without linked account
        logger.warn("RSO: failed to auto-link Riot account", {
          error: toError(err).message,
        });
      }
    }

    // Generate JWT
    const jwtToken = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Serialize user data for client
    const userForSerialization: UserForSerialization = {
      ...user,
      leagueAccount: user.leagueAccount ?? null,
    };
    const serializedUser = serializeUser(userForSerialization);

    // Build redirect response
    const response = NextResponse.redirect(buildSiteUrl("/"));
    const isProduction = process.env.NODE_ENV === "production";

    // Set auth JWT cookie (HttpOnly, Lax for cross-origin redirect)
    const authCookieParts = [
      `${AUTH_COOKIE_NAME}=${jwtToken}`,
      "Path=/",
      "Max-Age=604800", // 7 days
      "HttpOnly",
      "SameSite=Lax",
    ];
    if (isProduction) {
      authCookieParts.push("Secure");
    }
    response.headers.append("Set-Cookie", authCookieParts.join("; "));

    // Set temporary user data cookie (non-HttpOnly so client JS can read it)
    const userDataCookieParts = [
      `rso-user-data=${encodeURIComponent(JSON.stringify(serializedUser))}`,
      "Path=/",
      "Max-Age=60", // 60 seconds TTL
      "SameSite=Lax",
    ];
    if (isProduction) {
      userDataCookieParts.push("Secure");
    }
    response.headers.append("Set-Cookie", userDataCookieParts.join("; "));

    // Clear state cookie
    const clearStateParts = [
      "rso-state=",
      "Path=/",
      "Max-Age=0",
      "HttpOnly",
      "SameSite=Lax",
    ];
    if (isProduction) {
      clearStateParts.push("Secure");
    }
    response.headers.append("Set-Cookie", clearStateParts.join("; "));

    logger.info("RSO login successful", {
      userId: user.id,
      isNewUser: !user.lastLoginAt,
      hasGameName: !!gameName,
    });

    return response;
  } catch (error) {
    logger.error("RSO callback error", toError(error));
    return NextResponse.redirect(buildSiteUrl("/login?error=riot_error"));
  }
}
