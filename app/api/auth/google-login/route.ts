import { OAuth2Client } from "google-auth-library";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateToken, createAuthResponse } from "@/lib/jwt";
import { logger } from "@/lib/logger";
import {
  serializeUser,
  safeParseJson,
  errorResponse,
  handleApiError,
  type UserForSerialization,
} from "@/lib/api-helpers";
import { toError } from "@/lib/errors";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const oauthClient = GOOGLE_CLIENT_ID
  ? new OAuth2Client(GOOGLE_CLIENT_ID)
  : null;

export async function POST(request: Request) {
  if (!GOOGLE_CLIENT_ID) {
    return errorResponse("Google OAuth non configuré", 500);
  }

  try {
    const { data: body, error: parseError } = await safeParseJson<{ token?: string; accessToken?: string }>(request);

    if (parseError || (!body?.token && !body?.accessToken)) {
      return errorResponse(parseError ?? "Jeton Google manquant", 400);
    }

    let email: string;
    let name: string;

    if (body.accessToken) {
      // Flow: access_token from useGoogleLogin (popup OAuth)
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${body.accessToken}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        return errorResponse("Token Google invalide", 401);
      }
      const userInfo = (await res.json()) as { email?: string; name?: string };
      if (!userInfo.email) {
        return errorResponse("Impossible de valider l'adresse e-mail", 400);
      }
      email = userInfo.email;
      name = userInfo.name ?? email.split("@")[0];
    } else if (body.token) {
      // Flow: ID token from GoogleLogin credential (legacy)
      if (!oauthClient) {
        return errorResponse("Google OAuth non configuré", 500);
      }

      const ticket = await oauthClient.verifyIdToken({
        idToken: body.token,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload?.email) {
        return errorResponse("Impossible de valider l'adresse e-mail", 400);
      }

      email = payload.email;
      name = payload.name ?? payload.given_name ?? email.split("@")[0];
    } else {
      return errorResponse("Jeton Google manquant", 400);
    }

    let user = await prisma.user.findUnique({
      where: { email },
      include: { leagueAccount: true },
    });

    if (!user) {
      const randomPassword = randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 12);
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          lastLoginAt: new Date(),
        },
        include: { leagueAccount: true },
      });
    } else {
      // Mettre à jour la date de dernière connexion
      user = await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
        include: { leagueAccount: true },
      });
    }

    // Générer un token JWT
    const jwtToken = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Cast pour la sérialisation
    const userForSerialization: UserForSerialization = {
      ...user,
      leagueAccount: user.leagueAccount ?? null,
    };

    // Return response with token in HTTP-only cookie
    return createAuthResponse(
      {
        success: true,
        user: serializeUser(userForSerialization),
      },
      jwtToken
    );
  } catch (error) {
    logger.error("Erreur lors de l'authentification Google", toError(error));
    return handleApiError(error, "Authentification Google", "auth");
  }
}
