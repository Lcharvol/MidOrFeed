import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/types/roles";

interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Récupère l'utilisateur depuis le header Authorization ou depuis les cookies
 * Pour l'instant, on utilise localStorage côté client, donc on passe l'ID utilisateur
 * dans un header personnalisé ou dans le body de la requête
 */
export const getAuthenticatedUser = async (
  request: NextRequest
): Promise<{ id: string; email: string; role: string } | null> => {
  try {
    // Récupérer l'ID utilisateur depuis le header Authorization
    // Format: "Bearer {userId}" ou juste "{userId}"
    const authHeader = request.headers.get("authorization");
    const userId = authHeader?.replace("Bearer ", "") || null;

    if (!userId) {
      return null;
    }

    // Récupérer l'utilisateur depuis la base de données
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    return user;
  } catch (error) {
    console.error(
      "[AUTH] Erreur lors de la récupération de l'utilisateur:",
      error
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
