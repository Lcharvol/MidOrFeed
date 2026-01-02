import { SignJWT, jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { getEnv } from "./env";

/**
 * Clé secrète pour signer les JWT
 * DOIT être définie via JWT_SECRET en production
 */
const getJwtSecret = (): Uint8Array => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    // En développement, on autorise une clé par défaut avec un warning
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[JWT] ⚠️  JWT_SECRET non défini - utilisation d'une clé de développement. " +
        "NE PAS utiliser en production!"
      );
      return new TextEncoder().encode("dev-secret-key-do-not-use-in-production");
    }

    // En production, on refuse de démarrer sans secret
    throw new Error(
      "JWT_SECRET environment variable is required in production. " +
      "Please set a strong secret key (min 32 characters)."
    );
  }

  // Valider la longueur minimale du secret
  if (secret.length < 32) {
    throw new Error(
      "JWT_SECRET must be at least 32 characters long for security. " +
      `Current length: ${secret.length}`
    );
  }

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

/**
 * Cookie configuration for auth tokens
 */
export const AUTH_COOKIE_NAME = "auth-token";
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Set auth token cookie on response
 */
export const setAuthCookie = (
  response: Response,
  token: string
): void => {
  const isProduction = process.env.NODE_ENV === "production";

  // Get existing headers
  const headers = new Headers(response.headers);

  // Build cookie string
  const cookieParts = [
    `${AUTH_COOKIE_NAME}=${token}`,
    `Path=/`,
    `Max-Age=${AUTH_COOKIE_MAX_AGE}`,
    `HttpOnly`,
    `SameSite=Strict`,
  ];

  if (isProduction) {
    cookieParts.push("Secure");
  }

  headers.append("Set-Cookie", cookieParts.join("; "));
};

/**
 * Create auth response with HTTP-only cookie
 */
export const createAuthResponse = (
  data: object,
  token: string,
  status: number = 200
): NextResponse => {
  const isProduction = process.env.NODE_ENV === "production";

  const response = NextResponse.json(data, { status });

  // Build cookie string
  const cookieParts = [
    `${AUTH_COOKIE_NAME}=${token}`,
    `Path=/`,
    `Max-Age=${AUTH_COOKIE_MAX_AGE}`,
    `HttpOnly`,
    `SameSite=Strict`,
  ];

  if (isProduction) {
    cookieParts.push("Secure");
  }

  // Set cookie on response
  response.headers.append("Set-Cookie", cookieParts.join("; "));

  return response;
};

/**
 * Clear auth cookie (for logout)
 */
export const createLogoutResponse = (): NextResponse => {
  const cookieParts = [
    `${AUTH_COOKIE_NAME}=`,
    `Path=/`,
    `Max-Age=0`,
    `HttpOnly`,
    `SameSite=Strict`,
  ];

  if (process.env.NODE_ENV === "production") {
    cookieParts.push("Secure");
  }

  const response = NextResponse.json({ message: "Logged out" });
  response.headers.append("Set-Cookie", cookieParts.join("; "));

  return response;
};

