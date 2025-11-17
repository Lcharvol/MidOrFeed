/**
 * Tests de base pour l'endpoint /api/health
 * 
 * Pour exécuter les tests:
 * pnpm add -D vitest @vitest/ui
 * pnpm vitest
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { GET } from "@/app/api/health/route";

describe("/api/health", () => {
  it("should return 200 with healthy status", async () => {
    const request = new Request("http://localhost:3000/api/health");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBeDefined();
    expect(["healthy", "degraded", "unhealthy"]).toContain(data.status);
    expect(data.services).toBeDefined();
    expect(data.services.database).toBeDefined();
    expect(data.services.environment).toBeDefined();
  });

  it("should include timestamp and uptime", async () => {
    const request = new Request("http://localhost:3000/api/health");
    const response = await GET(request);
    const data = await response.json();

    expect(data.timestamp).toBeDefined();
    expect(data.uptime).toBeDefined();
    expect(typeof data.uptime).toBe("number");
  });

  it("should include response time", async () => {
    const request = new Request("http://localhost:3000/api/health");
    const response = await GET(request);
    const data = await response.json();

    expect(data.responseTime).toBeDefined();
    expect(typeof data.responseTime).toBe("number");
    expect(data.responseTime).toBeGreaterThanOrEqual(0);
  });
});

