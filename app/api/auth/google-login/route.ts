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

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const oauthClient = GOOGLE_CLIENT_ID
  ? new OAuth2Client(GOOGLE_CLIENT_ID)
  : null;

export async function POST(request: Request) {
  if (!oauthClient || !GOOGLE_CLIENT_ID) {
    return errorResponse("Google OAuth non configuré", 500);
  }

  try {
    const { data: body, error: parseError } = await safeParseJson<{ token?: string }>(request);

    if (parseError || !body?.token) {
      return errorResponse(parseError ?? "Jeton Google manquant", 400);
    }

    const googleToken = body.token;

    const ticket = await oauthClient.verifyIdToken({
      idToken: googleToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      return errorResponse("Impossible de valider l'adresse e-mail", 400);
    }

    const email = payload.email;
    const name = payload.name ?? payload.given_name ?? email.split("@")[0];

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
    logger.error("Erreur lors de l'authentification Google", error as Error);
    return handleApiError(error, "Authentification Google", "auth");
  }
}
