/**
 * Tests pour le cache en mémoire
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import {
  cache,
  getOrSetCache,
  invalidateCache,
  invalidateCachePrefix,
  hasCache,
  CacheTTL,
} from "@/lib/cache";

describe("MemoryCache", () => {
  beforeEach(() => {
    cache.clear();
  });

  describe("get/set", () => {
    it("should store and retrieve a value", () => {
      cache.set("key1", "value1", 60000);
      expect(cache.get("key1")).toBe("value1");
    });

    it("should return null for non-existent key", () => {
      expect(cache.get("nonexistent")).toBeNull();
    });

    it("should return null for expired key", async () => {
      cache.set("expiring", "value", 10); // 10ms TTL

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(cache.get("expiring")).toBeNull();
    });

    it("should overwrite existing value", () => {
      cache.set("key", "first", 60000);
      cache.set("key", "second", 60000);
      expect(cache.get("key")).toBe("second");
    });

    it("should store complex objects", () => {
      const obj = { name: "test", nested: { value: 42 } };
      cache.set("obj", obj, 60000);
      expect(cache.get("obj")).toEqual(obj);
    });
  });

  describe("delete", () => {
    it("should delete an existing key", () => {
      cache.set("key", "value", 60000);
      cache.delete("key");
      expect(cache.get("key")).toBeNull();
    });

    it("should not throw when deleting non-existent key", () => {
      expect(() => cache.delete("nonexistent")).not.toThrow();
    });
  });

  describe("clear", () => {
    it("should remove all entries", () => {
      cache.set("key1", "v1", 60000);
      cache.set("key2", "v2", 60000);
      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.get("key1")).toBeNull();
    });
  });

  describe("size", () => {
    it("should return 0 for empty cache", () => {
      expect(cache.size()).toBe(0);
    });

    it("should return correct count", () => {
      cache.set("a", 1, 60000);
      cache.set("b", 2, 60000);
      cache.set("c", 3, 60000);
      expect(cache.size()).toBe(3);
    });
  });
});

describe("getOrSetCache", () => {
  beforeEach(() => {
    cache.clear();
  });

  it("should call fetcher and cache result on miss", async () => {
    const fetcher = vi.fn().mockResolvedValue("fetched-value");
    const result = await getOrSetCache("key", 60000, fetcher);

    expect(result).toBe("fetched-value");
    expect(fetcher).toHaveBeenCalledOnce();
    expect(cache.get("key")).toBe("fetched-value");
  });

  it("should return cached value without calling fetcher on hit", async () => {
    cache.set("key", "cached-value", 60000);
    const fetcher = vi.fn().mockResolvedValue("new-value");

    const result = await getOrSetCache("key", 60000, fetcher);

    expect(result).toBe("cached-value");
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("invalidateCache", () => {
  beforeEach(() => {
    cache.clear();
  });

  it("should invalidate a specific key", () => {
    cache.set("key1", "v1", 60000);
    cache.set("key2", "v2", 60000);
    invalidateCache("key1");

    expect(cache.get("key1")).toBeNull();
    expect(cache.get("key2")).toBe("v2");
  });
});

describe("invalidateCachePrefix", () => {
  beforeEach(() => {
    cache.clear();
  });

  it("should invalidate all keys with prefix", () => {
    cache.set("riot:summoner:1", "s1", 60000);
    cache.set("riot:summoner:2", "s2", 60000);
    cache.set("riot:match:1", "m1", 60000);
    cache.set("other:key", "ok", 60000);

    invalidateCachePrefix("riot:summoner");

    expect(cache.get("riot:summoner:1")).toBeNull();
    expect(cache.get("riot:summoner:2")).toBeNull();
    expect(cache.get("riot:match:1")).toBe("m1");
    expect(cache.get("other:key")).toBe("ok");
  });
});

describe("hasCache", () => {
  beforeEach(() => {
    cache.clear();
  });

  it("should return true for existing key", () => {
    cache.set("exists", "value", 60000);
    expect(hasCache("exists")).toBe(true);
  });

  it("should return false for non-existent key", () => {
    expect(hasCache("nope")).toBe(false);
  });
});

describe("CacheTTL", () => {
  it("should have correct TTL values", () => {
    expect(CacheTTL.SHORT).toBe(60_000);
    expect(CacheTTL.MEDIUM).toBe(300_000);
    expect(CacheTTL.LONG).toBe(900_000);
    expect(CacheTTL.VERY_LONG).toBe(3_600_000);
    expect(CacheTTL.DAY).toBe(86_400_000);
  });
});
