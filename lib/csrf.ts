import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomBytes } from "crypto";

/**
 * CSRF Token Protection
 *
 * Strategy: Double Submit Cookie Pattern
 * - Server generates a random token
 * - Token is stored in a cookie (SameSite=Strict)
 * - Client must send the same token in X-CSRF-Token header
 * - Server validates both match
 */

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get the secret for HMAC signing
 * Uses JWT_SECRET for consistency
 */
const getCsrfSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      return "dev-csrf-secret-do-not-use-in-production";
    }
    throw new Error("JWT_SECRET environment variable is required for CSRF protection");
  }

  return secret;
};

/**
 * Generate a new CSRF token
 * Format: timestamp.random.signature
 */
export const generateCsrfToken = (): string => {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(16).toString("hex");
  const data = `${timestamp}.${random}`;

  const signature = createHmac("sha256", getCsrfSecret())
    .update(data)
    .digest("hex")
    .slice(0, 16); // Shortened for convenience

  return `${data}.${signature}`;
};

/**
 * Validate a CSRF token
 * Checks signature and expiry
 */
export const validateCsrfToken = (token: string | null): boolean => {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [timestamp, random, signature] = parts;

  // Verify signature
  const data = `${timestamp}.${random}`;
  const expectedSignature = createHmac("sha256", getCsrfSecret())
    .update(data)
    .digest("hex")
    .slice(0, 16);

  if (signature !== expectedSignature) {
    return false;
  }

  // Check expiry
  const tokenTime = parseInt(timestamp, 36);
  if (Date.now() - tokenTime > CSRF_TOKEN_EXPIRY) {
    return false;
  }

  return true;
};

/**
 * Extract CSRF token from request
 * Checks both cookie and header
 */
export const getCsrfTokenFromRequest = (request: NextRequest): {
  cookieToken: string | null;
  headerToken: string | null;
} => {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value || null;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  return { cookieToken, headerToken };
};

/**
 * Validate CSRF for a request
 * Both cookie and header must match and be valid
 */
export const validateCsrfRequest = (request: NextRequest): boolean => {
  // Skip CSRF check for GET, HEAD, OPTIONS requests (safe methods)
  const safeMethod = ["GET", "HEAD", "OPTIONS"].includes(request.method);
  if (safeMethod) return true;

  const { cookieToken, headerToken } = getCsrfTokenFromRequest(request);

  // Both must be present
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Both must match
  if (cookieToken !== headerToken) {
    return false;
  }

  // Token must be valid
  return validateCsrfToken(cookieToken);
};

/**
 * Set CSRF cookie on response
 */
export const setCsrfCookie = (response: NextResponse, token: string): void => {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JavaScript to send in header
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: CSRF_TOKEN_EXPIRY / 1000,
  });
};

/**
 * Middleware to validate CSRF for admin routes
 * Returns error response if invalid, null if valid
 */
export const requireCsrf = (request: NextRequest): NextResponse | null => {
  if (!validateCsrfRequest(request)) {
    console.warn(
      `[CSRF] Validation failed for ${request.method} ${request.url}`,
      {
        hasHeader: !!request.headers.get(CSRF_HEADER_NAME),
        hasCookie: !!request.cookies.get(CSRF_COOKIE_NAME),
      }
    );

    return NextResponse.json(
      {
        error: "CSRF validation failed",
        message: "Please refresh the page and try again",
      },
      { status: 403 }
    );
  }

  return null;
};

// Export constants for client-side usage
export const CSRF_CONSTANTS = {
  COOKIE_NAME: CSRF_COOKIE_NAME,
  HEADER_NAME: CSRF_HEADER_NAME,
} as const;
