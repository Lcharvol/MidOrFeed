import { randomBytes } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { getEnv } from "@/lib/env";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { buildSiteUrl } from "@/constants/site";

export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.auth);
  if (rateLimitResponse) return rateLimitResponse;

  const env = getEnv();
  const clientId = env.RIOT_RSO_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(
      buildSiteUrl("/login?error=riot_not_configured")
    );
  }

  const state = randomBytes(32).toString("hex");
  const redirectUri = buildSiteUrl("/api/auth/riot/callback");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid cpid",
    state,
  });

  const authorizeUrl = `https://auth.riotgames.com/authorize?${params.toString()}`;

  const response = NextResponse.redirect(authorizeUrl);

  // Store state in cookie for CSRF validation on callback
  const isProduction = process.env.NODE_ENV === "production";
  const stateCookieParts = [
    `rso-state=${state}`,
    "Path=/",
    "Max-Age=300", // 5 minutes
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (isProduction) {
    stateCookieParts.push("Secure");
  }
  response.headers.append("Set-Cookie", stateCookieParts.join("; "));

  return response;
}
