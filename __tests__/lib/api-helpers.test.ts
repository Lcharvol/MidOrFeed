/**
 * Tests pour les helpers API (serialization, error handling)
 */

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/alerting", () => ({
  alerting: {
    medium: vi.fn(),
    high: vi.fn(),
    low: vi.fn(),
  },
}));

vi.mock("@/lib/i18n-server", () => ({
  getLocaleFromRequest: vi.fn(() => "fr"),
  createTranslator: vi.fn(() => (key: string) => key),
}));

import {
  serializeUser,
  errorResponse,
  successResponse,
  handleZodError,
  handleApiError,
} from "@/lib/api-helpers";
import type { UserForSerialization } from "@/lib/api-helpers";
import { z } from "zod";

describe("API Helpers", () => {
  describe("serializeUser", () => {
    it("should serialize dates to ISO strings", () => {
      const user: UserForSerialization = {
        id: "user-1",
        email: "test@test.com",
        name: "Test User",
        role: "user",
        subscriptionTier: "free",
        subscriptionExpiresAt: new Date("2025-12-31T00:00:00Z"),
        dailyAnalysesUsed: 3,
        lastDailyReset: new Date("2025-01-15T00:00:00Z"),
        leagueAccount: null,
      };

      const serialized = serializeUser(user);

      expect(serialized.subscriptionExpiresAt).toBe("2025-12-31T00:00:00.000Z");
      expect(serialized.lastDailyReset).toBe("2025-01-15T00:00:00.000Z");
    });

    it("should handle null dates", () => {
      const user: UserForSerialization = {
        id: "user-1",
        email: "test@test.com",
        name: null,
        role: "user",
        subscriptionTier: "free",
        subscriptionExpiresAt: null,
        dailyAnalysesUsed: 0,
        lastDailyReset: null,
        leagueAccount: null,
      };

      const serialized = serializeUser(user);

      expect(serialized.subscriptionExpiresAt).toBeNull();
      expect(serialized.lastDailyReset).toBeNull();
      expect(serialized.name).toBeNull();
    });

    it("should serialize league account when present", () => {
      const user: UserForSerialization = {
        id: "user-1",
        email: "test@test.com",
        name: "Test",
        role: "user",
        subscriptionTier: "free",
        subscriptionExpiresAt: null,
        dailyAnalysesUsed: 0,
        lastDailyReset: null,
        leagueAccount: {
          id: "la-1",
          puuid: "puuid-123",
          riotRegion: "euw1",
          riotGameName: "Player",
          riotTagLine: "EUW",
          profileIconId: 5000,
        },
      };

      const serialized = serializeUser(user);

      expect(serialized.leagueAccount).toEqual({
        id: "la-1",
        puuid: "puuid-123",
        riotRegion: "euw1",
        riotGameName: "Player",
        riotTagLine: "EUW",
        profileIconId: 5000,
      });
    });
  });

  describe("errorResponse", () => {
    it("should return JSON response with error format", async () => {
      const response = errorResponse("Something went wrong", 400);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Something went wrong");
    });

    it("should include details when provided", async () => {
      const details = { field: "email", reason: "invalid" };
      const response = errorResponse("Validation error", 422, details);
      const data = await response.json();

      expect(data.details).toEqual(details);
    });

    it("should default to 400 status", async () => {
      const response = errorResponse("Bad request");
      expect(response.status).toBe(400);
    });

    it("should support 500 status", async () => {
      const response = errorResponse("Internal error", 500);
      expect(response.status).toBe(500);
    });
  });

  describe("successResponse", () => {
    it("should return JSON response with data", async () => {
      const response = successResponse({ message: "ok" });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("ok");
    });

    it("should support custom status codes", async () => {
      const response = successResponse({ id: "123" }, 201);
      expect(response.status).toBe(201);
    });
  });

  describe("handleZodError", () => {
    it("should return 400 with validation errors", async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      const result = schema.safeParse({ email: "invalid", age: 10 });
      if (result.success) throw new Error("Expected validation error");

      const response = handleZodError(result.error);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Données invalides");
      expect(data.details).toBeDefined();
      expect(Array.isArray(data.details)).toBe(true);
    });
  });

  describe("handleApiError", () => {
    it("should return 500 with context message", async () => {
      const error = new Error("Database connection failed");
      const response = handleApiError(error, "Fetching user data");
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Fetching user data");
    });

    it("should handle non-Error objects", async () => {
      const response = handleApiError("string error", "Processing");
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
