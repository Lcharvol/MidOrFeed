/**
 * Tests pour les utilitaires de pagination
 */

import { describe, it, expect } from "vitest";
import {
  paginationSchema,
  getSkip,
  createPaginatedResponse,
} from "@/lib/pagination";

describe("pagination utilities", () => {
  describe("paginationSchema", () => {
    it("should parse valid pagination params", () => {
      const result = paginationSchema.parse({
        page: "2",
        limit: "20",
      });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
    });

    it("should default to page 1 and limit 20", () => {
      const result = paginationSchema.parse({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("should enforce minimum page of 1", () => {
      const result = paginationSchema.parse({ page: "0" });

      expect(result.page).toBe(1);
    });

    it("should enforce limit between 1 and 1000", () => {
      const result1 = paginationSchema.parse({ limit: "0" });
      expect(result1.limit).toBe(1);

      const result2 = paginationSchema.parse({ limit: "2000" });
      expect(result2.limit).toBe(1000);
    });
  });

  describe("getSkip", () => {
    it("should calculate skip correctly", () => {
      expect(getSkip(1, 20)).toBe(0);
      expect(getSkip(2, 20)).toBe(20);
      expect(getSkip(3, 20)).toBe(40);
    });
  });

  describe("createPaginatedResponse", () => {
    it("should create paginated response correctly", () => {
      const data = [1, 2, 3, 4, 5];
      const result = createPaginatedResponse(data, 100, 1, 20);

      expect(result.data).toEqual(data);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(100);
      expect(result.pagination.totalPages).toBe(5);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrevious).toBe(false);
    });

    it("should handle last page correctly", () => {
      const data = [1, 2, 3];
      const result = createPaginatedResponse(data, 23, 5, 5);

      expect(result.pagination.totalPages).toBe(5);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrevious).toBe(true);
    });
  });
});

