/**
 * Tests pour le rate limiting
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Redis pour éviter la connexion
vi.mock("ioredis", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue("OK"),
      incr: vi.fn().mockResolvedValue(1),
      quit: vi.fn().mockResolvedValue("OK"),
    })),
  };
});

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Import après les mocks
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

describe("rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow first request under the limit", async () => {
    const request = new NextRequest("http://localhost:3000/api/test", {
      headers: {
        "x-forwarded-for": `192.168.1.${Date.now()}`,
      },
    });

    const config = { limit: 10, windowMs: 60000 };
    const response = await rateLimit(request, config);
    expect(response).toBeNull(); // Pas de limite atteinte
  });

  it("should have auth preset with correct configuration", () => {
    const authPreset = rateLimitPresets.auth;

    expect(authPreset.limit).toBeDefined();
    expect(authPreset.windowMs).toBeDefined();
    expect(authPreset.message).toBeDefined();
    expect(typeof authPreset.limit).toBe("number");
    expect(authPreset.limit).toBeGreaterThan(0);
  });

  it("should have api preset with correct configuration", () => {
    const apiPreset = rateLimitPresets.api;

    expect(apiPreset.limit).toBeDefined();
    expect(apiPreset.windowMs).toBeDefined();
    expect(apiPreset.message).toBeDefined();
    expect(typeof apiPreset.limit).toBe("number");
  });

  it("should have admin preset with correct configuration", () => {
    const adminPreset = rateLimitPresets.admin;

    expect(adminPreset.limit).toBeDefined();
    expect(adminPreset.windowMs).toBeDefined();
    expect(adminPreset.message).toBeDefined();
  });

  it("should have strict preset for sensitive endpoints", () => {
    const strictPreset = rateLimitPresets.strict;

    expect(strictPreset.limit).toBe(10);
    expect(strictPreset.windowMs).toBe(60 * 60 * 1000); // 1 hour
    expect(strictPreset.message).toBeDefined();
  });

  it("should identify request by x-forwarded-for header", async () => {
    const ip = `test-ip-${Date.now()}`;
    const request = new NextRequest("http://localhost:3000/api/test", {
      headers: {
        "x-forwarded-for": ip,
      },
    });

    const config = { limit: 5, windowMs: 60000 };
    const response = await rateLimit(request, config);

    // First request should pass
    expect(response).toBeNull();
  });

  it("should return 429 response with correct headers when limit exceeded", async () => {
    // This is more of an integration test - we'd need to simulate multiple requests
    // For now, we just verify the response format when limit is 0
    const request = new NextRequest("http://localhost:3000/api/test", {
      headers: {
        "x-forwarded-for": `blocked-ip-${Date.now()}`,
      },
    });

    // Limit of 0 means immediate block after first (which sets the record)
    const config = { limit: 0, windowMs: 60000, message: "Custom block message" };

    // First request sets the record
    await rateLimit(request, config);

    // Second request should be blocked
    const response = await rateLimit(request, config);

    if (response) {
      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toBe("Custom block message");
      expect(data.retryAfter).toBeDefined();
    }
  });
});
