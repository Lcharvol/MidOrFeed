import { SignJWT, jwtVerify } from "jose";
import { getEnv } from "./env";

/**
 * Clé secrète pour signer les JWT
 * Utilise JWT_SECRET de l'environnement ou génère une clé par défaut pour le développement
 */
const getJwtSecret = (): Uint8Array => {
  const secret = process.env.JWT_SECRET || "dev-secret-key-change-in-production";
  return new TextEncoder().encode(secret);
};

/**
 * Payload du token JWT
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

/**
 * Durée de validité du token (7 jours par défaut)
 */
const TOKEN_EXPIRY = "7d";

/**
 * Génère un token JWT pour un utilisateur
 */
export const generateToken = async (payload: {
  userId: string;
  email: string;
  role: string;
}): Promise<string> => {
  const secret = getJwtSecret();

  const jwt = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  } as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret);

  return jwt;
};

/**
 * Vérifie et décode un token JWT
 * @returns Le payload du token ou null si invalide
 */
export const verifyToken = async (token: string): Promise<JWTPayload | null> => {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);

    return payload as JWTPayload;
  } catch (error) {
    // Token invalide ou expiré
    return null;
  }
};

/**
 * Extrait le token JWT depuis l'Authorization header
 * Format: "Bearer <token>"
 */
export const extractTokenFromHeader = (
  authHeader: string | null
): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
};

