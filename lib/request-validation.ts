import { NextRequest } from "next/server";

const JSON_BODY_MAX_SIZE = 1024 * 1024; // 1MB

/**
 * Lit et valide la taille du body d'une requête
 * @throws {Error} Si la taille dépasse la limite
 */
export const readAndValidateBody = async (
  request: NextRequest,
  maxSize: number = JSON_BODY_MAX_SIZE
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

