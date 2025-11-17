import { NextRequest, NextResponse } from "next/server";

/**
 * Limites de taille pour les requêtes
 */
export const REQUEST_SIZE_LIMITS = {
  /**
   * Taille maximale du body JSON (1MB par défaut)
   */
  JSON_BODY_MAX_SIZE: 1024 * 1024, // 1MB

  /**
   * Taille maximale pour les uploads (10MB)
   */
  UPLOAD_MAX_SIZE: 10 * 1024 * 1024, // 10MB

  /**
   * Taille maximale pour les requêtes admin (5MB)
   */
  ADMIN_MAX_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

/**
 * Lit et valide la taille du body d'une requête
 * @throws {Error} Si la taille dépasse la limite
 */
export const readAndValidateBody = async (
  request: NextRequest,
  maxSize: number = REQUEST_SIZE_LIMITS.JSON_BODY_MAX_SIZE
): Promise<unknown> => {
  const contentLength = request.headers.get("content-length");
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > maxSize) {
      throw new Error(
        `Taille de requête trop grande: ${size} bytes (limite: ${maxSize} bytes)`
      );
    }
  }

  // Lire le body avec une limite
  const body = await request.json();
  
  // Vérifier la taille approximative du body parsé
  const bodySize = JSON.stringify(body).length;
  if (bodySize > maxSize) {
    throw new Error(
      `Taille de requête trop grande: ${bodySize} bytes (limite: ${maxSize} bytes)`
    );
  }

  return body;
};

/**
 * Wrapper pour les handlers API avec validation de taille
 */
export const withRequestValidation = async <T>(
  request: NextRequest,
  handler: (body: unknown) => Promise<T>,
  maxSize: number = REQUEST_SIZE_LIMITS.JSON_BODY_MAX_SIZE
): Promise<T | NextResponse> => {
  try {
    const body = await readAndValidateBody(request, maxSize);
    return await handler(body);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Taille de requête")) {
      return NextResponse.json(
        {
          error: error.message,
          maxSize,
        },
        { status: 413 } // Payload Too Large
      );
    }
    throw error;
  }
};

