/**
 * Tests pour le rate limiting
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

describe("rate limiting", () => {
  beforeEach(() => {
    // Nettoyer le store entre les tests
    vi.clearAllMocks();
  });

  it("should allow requests under the limit", async () => {
    const request = new NextRequest("http://localhost:3000/api/test", {
      headers: {
        "x-forwarded-for": "192.168.1.1",
      },
    });

    const config = { limit: 10, windowMs: 60000 };
    
    for (let i = 0; i < 5; i++) {
      const response = await rateLimit(request, config);
      expect(response).toBeNull(); // Pas de limite atteinte
    }
  });

  it("should block requests over the limit", async () => {
    const request = new NextRequest("http://localhost:3000/api/test", {
      headers: {
        "x-forwarded-for": "192.168.1.2",
      },
    });

    const config = { limit: 3, windowMs: 60000 };

    // Faire 3 requêtes qui passent
    for (let i = 0; i < 3; i++) {
      const response = await rateLimit(request, config);
      expect(response).toBeNull();
    }

    // La 4ème devrait être bloquée
    const response = await rateLimit(request, config);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(429);
  });

  it("should use auth preset correctly", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      headers: {
        "x-forwarded-for": "192.168.1.3",
      },
    });

    // Avec le preset auth (5 req / 15 min), on devrait pouvoir faire 5 requêtes
    for (let i = 0; i < 5; i++) {
      const response = await rateLimit(request, rateLimitPresets.auth);
      expect(response).toBeNull();
    }

    // La 6ème devrait être bloquée
    const response = await rateLimit(request, rateLimitPresets.auth);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(429);
  });
});

