import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/types/roles";
import { verifyToken, extractTokenFromHeader } from "@/lib/jwt";
import { logger } from "@/lib/logger";

/**
 * Récupère l'utilisateur authentifié depuis le header Authorization
 * Utilise JWT pour valider l'authentification
 * Format: "Bearer <jwt-token>"
 */
export const getAuthenticatedUser = async (
  request: NextRequest
): Promise<{ id: string; email: string; role: string } | null> => {
  try {
    // Extraire le token JWT depuis le header Authorization
    const authHeader = request.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return null;
    }

    // Vérifier et décoder le token JWT
    const payload = await verifyToken(token);

    if (!payload || !payload.userId) {
      return null;
    }

    // Optionnel: Vérifier que l'utilisateur existe toujours dans la base
    // (utile si un utilisateur est supprimé mais son token est encore valide)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      logger.warn("Token JWT valide mais utilisateur introuvable", {
        userId: payload.userId,
      });
      return null;
    }

    // Vérifier que l'email correspond (sécurité supplémentaire)
    if (user.email !== payload.email) {
      logger.warn("Email mismatch entre token et base de données", {
        userId: payload.userId,
        tokenEmail: payload.email,
        dbEmail: user.email,
      });
      return null;
    }

    return user;
  } catch (error) {
    logger.error(
      "Erreur lors de la récupération de l'utilisateur",
      error as Error
    );
    return null;
  }
};

/**
 * Middleware pour protéger les routes admin
 * Vérifie que l'utilisateur est authentifié et a le rôle admin
 */
export const requireAdmin = async (
  request: NextRequest
): Promise<NextResponse | null> => {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!isAdmin(user.role)) {
    return NextResponse.json(
      { error: "Accès refusé. Rôle admin requis." },
      { status: 403 }
    );
  }

  return null; // Autoriser l'accès
};

/**
 * Middleware pour protéger les routes nécessitant une authentification
 */
export const requireAuth = async (
  request: NextRequest
): Promise<NextResponse | null> => {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  return null; // Autoriser l'accès
};
