/**
 * Tests pour la protection CSRF (Double Submit Cookie Pattern)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.stubEnv("JWT_SECRET", "test-csrf-secret-key-that-is-at-least-32-chars");
vi.stubEnv("NODE_ENV", "test");

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import {
  generateCsrfToken,
  generateSimpleCsrfToken,
  validateCsrfToken,
  validateCsrfRequest,
  getCsrfTokenFromRequest,
  requireCsrf,
  CSRF_CONSTANTS,
} from "@/lib/csrf";
import { NextRequest } from "next/server";

describe("CSRF Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateCsrfToken", () => {
    it("should generate a token with 3 parts (timestamp.random.signature)", async () => {
      const token = await generateCsrfToken();
      const parts = token.split(".");
      expect(parts).toHaveLength(3);
      expect(parts[0].length).toBeGreaterThan(0); // timestamp
      expect(parts[1].length).toBe(32); // 16 random bytes = 32 hex chars
      expect(parts[2].length).toBe(16); // HMAC truncated to 16 chars
    });

    it("should generate unique tokens", async () => {
      const token1 = await generateCsrfToken();
      const token2 = await generateCsrfToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe("generateSimpleCsrfToken", () => {
    it("should generate a token with 2 parts (timestamp.random)", () => {
      const token = generateSimpleCsrfToken();
      const parts = token.split(".");
      expect(parts).toHaveLength(2);
    });

    it("should generate unique tokens", () => {
      const token1 = generateSimpleCsrfToken();
      const token2 = generateSimpleCsrfToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe("validateCsrfToken", () => {
    it("should validate a valid signed token", async () => {
      const token = await generateCsrfToken();
      const isValid = await validateCsrfToken(token);
      expect(isValid).toBe(true);
    });

    it("should validate a valid simple token", async () => {
      const token = generateSimpleCsrfToken();
      const isValid = await validateCsrfToken(token);
      expect(isValid).toBe(true);
    });

    it("should reject null token", async () => {
      expect(await validateCsrfToken(null)).toBe(false);
    });

    it("should reject token with invalid signature", async () => {
      const token = await generateCsrfToken();
      const parts = token.split(".");
      const tampered = `${parts[0]}.${parts[1]}.invalidSignature`;
      expect(await validateCsrfToken(tampered)).toBe(false);
    });

    it("should reject token with wrong number of parts", async () => {
      expect(await validateCsrfToken("only-one-part")).toBe(false);
      expect(await validateCsrfToken("a.b.c.d")).toBe(false);
    });

    it("should reject expired token", async () => {
      // Create a token with a very old timestamp
      const oldTimestamp = (Date.now() - 25 * 60 * 60 * 1000).toString(36); // 25 hours ago
      const expiredSimpleToken = `${oldTimestamp}.abcdef1234567890abcdef1234567890`;
      expect(await validateCsrfToken(expiredSimpleToken)).toBe(false);
    });
  });

  describe("getCsrfTokenFromRequest", () => {
    it("should extract cookie and header tokens", () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          "x-csrf-token": "test-token-value",
          cookie: "csrf-token=test-token-value",
        },
      });

      const { cookieToken, headerToken } = getCsrfTokenFromRequest(request);
      expect(headerToken).toBe("test-token-value");
      expect(cookieToken).toBe("test-token-value");
    });

    it("should return null for missing tokens", () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
      });

      const { cookieToken, headerToken } = getCsrfTokenFromRequest(request);
      expect(headerToken).toBeNull();
      expect(cookieToken).toBeNull();
    });
  });

  describe("validateCsrfRequest", () => {
    it("should skip CSRF for GET requests", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "GET",
      });
      expect(await validateCsrfRequest(request)).toBe(true);
    });

    it("should skip CSRF for HEAD requests", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "HEAD",
      });
      expect(await validateCsrfRequest(request)).toBe(true);
    });

    it("should skip CSRF for OPTIONS requests", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "OPTIONS",
      });
      expect(await validateCsrfRequest(request)).toBe(true);
    });

    it("should reject POST without CSRF tokens", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
      });
      expect(await validateCsrfRequest(request)).toBe(false);
    });

    it("should reject POST with mismatched tokens", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          "x-csrf-token": "token-a",
          cookie: "csrf-token=token-b",
        },
      });
      expect(await validateCsrfRequest(request)).toBe(false);
    });

    it("should accept POST with valid matching tokens", async () => {
      const token = generateSimpleCsrfToken();
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          "x-csrf-token": token,
          cookie: `csrf-token=${token}`,
        },
      });
      expect(await validateCsrfRequest(request)).toBe(true);
    });
  });

  describe("requireCsrf", () => {
    it("should return null for valid CSRF", async () => {
      const token = generateSimpleCsrfToken();
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: {
          "x-csrf-token": token,
          cookie: `csrf-token=${token}`,
        },
      });
      expect(await requireCsrf(request)).toBeNull();
    });

    it("should return 403 response for invalid CSRF", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
      });
      const response = await requireCsrf(request);
      expect(response).not.toBeNull();
      expect(response!.status).toBe(403);
      const data = await response!.json();
      expect(data.error).toContain("CSRF");
    });
  });

  describe("CSRF_CONSTANTS", () => {
    it("should export cookie and header names", () => {
      expect(CSRF_CONSTANTS.COOKIE_NAME).toBe("csrf-token");
      expect(CSRF_CONSTANTS.HEADER_NAME).toBe("x-csrf-token");
    });
  });
});
