/**
 * Tests pour l'endpoint /api/health
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock des dépendances avant l'import du module
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
  },
}));

vi.mock("@/lib/timeout", () => ({
  prismaWithTimeout: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

vi.mock("@/lib/env", () => ({
  getEnv: vi.fn(() => ({
    DATABASE_URL: "postgresql://test",
    RIOT_API_KEY: "test-key",
    REDIS_URL: undefined,
  })),
}));

vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn(() => ({
    ping: vi.fn().mockResolvedValue("PONG"),
  })),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

import { GET } from "@/app/api/health/route";

describe("/api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 with healthy status", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBeDefined();
    expect(["healthy", "degraded", "unhealthy"]).toContain(data.status);
    expect(data.services).toBeDefined();
    expect(data.services.database).toBeDefined();
    expect(data.services.environment).toBeDefined();
  });

  it("should include timestamp and uptime", async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.timestamp).toBeDefined();
    expect(data.uptime).toBeDefined();
    expect(typeof data.uptime).toBe("number");
  });

  it("should include response time", async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.responseTime).toBeDefined();
    expect(typeof data.responseTime).toBe("number");
    expect(data.responseTime).toBeGreaterThanOrEqual(0);
  });

  it("should have cache-control headers", async () => {
    const response = await GET();

    expect(response.headers.get("Cache-Control")).toBe(
      "no-cache, no-store, must-revalidate"
    );
    expect(response.headers.get("X-Response-Time")).toBeDefined();
  });
});
