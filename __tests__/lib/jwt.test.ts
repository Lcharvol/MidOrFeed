/**
 * Tests pour les utilitaires JWT
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock environment
vi.stubEnv("JWT_SECRET", "test-secret-key-that-is-at-least-32-chars-long");
vi.stubEnv("NODE_ENV", "test");

import {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
  AUTH_COOKIE_NAME,
} from "@/lib/jwt";

describe("JWT Utilities", () => {
  describe("extractTokenFromHeader", () => {
    it("should extract token from valid Bearer header", () => {
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
      const result = extractTokenFromHeader(`Bearer ${token}`);
      expect(result).toBe(token);
    });

    it("should return null for null header", () => {
      expect(extractTokenFromHeader(null)).toBeNull();
    });

    it("should return null for empty header", () => {
      expect(extractTokenFromHeader("")).toBeNull();
    });

    it("should return null for header without Bearer prefix", () => {
      expect(extractTokenFromHeader("Basic sometoken")).toBeNull();
      expect(extractTokenFromHeader("sometoken")).toBeNull();
    });

    it("should return null for Bearer without token", () => {
      expect(extractTokenFromHeader("Bearer")).toBeNull();
    });

    it("should return null for Bearer with multiple spaces", () => {
      expect(extractTokenFromHeader("Bearer  token")).toBeNull();
    });

    it("should handle case-sensitive Bearer", () => {
      // Bearer must be exactly "Bearer" (case-sensitive per RFC 6750)
      expect(extractTokenFromHeader("bearer token")).toBeNull();
      expect(extractTokenFromHeader("BEARER token")).toBeNull();
    });
  });

  describe("generateToken and verifyToken", () => {
    const testPayload = {
      userId: "user-123",
      email: "test@example.com",
      role: "user",
    };

    it("should generate a valid JWT token", async () => {
      const token = await generateToken(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      // JWT format: header.payload.signature
      expect(token.split(".")).toHaveLength(3);
    });

    it("should verify a valid token and return payload", async () => {
      const token = await generateToken(testPayload);
      const payload = await verifyToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(testPayload.userId);
      expect(payload?.email).toBe(testPayload.email);
      expect(payload?.role).toBe(testPayload.role);
    });

    it("should include iat and exp in payload", async () => {
      const token = await generateToken(testPayload);
      const payload = await verifyToken(token);

      expect(payload?.iat).toBeDefined();
      expect(payload?.exp).toBeDefined();
      expect(typeof payload?.iat).toBe("number");
      expect(typeof payload?.exp).toBe("number");
      expect(payload!.exp! > payload!.iat!).toBe(true);
    });

    it("should return null for invalid token", async () => {
      const payload = await verifyToken("invalid.token.here");
      expect(payload).toBeNull();
    });

    it("should return null for malformed token", async () => {
      const payload = await verifyToken("not-a-jwt");
      expect(payload).toBeNull();
    });

    it("should return null for empty token", async () => {
      const payload = await verifyToken("");
      expect(payload).toBeNull();
    });

    it("should return null for tampered token", async () => {
      const token = await generateToken(testPayload);
      // Tamper with the token by changing a character
      const tamperedToken = token.slice(0, -1) + "X";
      const payload = await verifyToken(tamperedToken);
      expect(payload).toBeNull();
    });
  });

  describe("AUTH_COOKIE_NAME", () => {
    it("should be defined", () => {
      expect(AUTH_COOKIE_NAME).toBeDefined();
      expect(typeof AUTH_COOKIE_NAME).toBe("string");
      expect(AUTH_COOKIE_NAME.length).toBeGreaterThan(0);
    });
  });
});
