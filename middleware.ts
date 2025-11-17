import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { securityHeadersMiddleware } from "@/lib/security-headers";

/**
 * Middleware Next.js pour appliquer les headers de sécurité à toutes les réponses
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Appliquer les headers de sécurité
  securityHeadersMiddleware(
    response.headers,
    process.env.NODE_ENV === "production"
  );

  return response;
}

/**
 * Configuration du middleware
 * Appliquer à toutes les routes sauf les fichiers statiques
 */
export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf:
     * - api (gérés individuellement)
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico (favicon)
     * - fichiers statiques (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)",
  ],
};
