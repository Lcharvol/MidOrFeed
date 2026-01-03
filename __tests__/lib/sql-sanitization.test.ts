/**
 * Tests pour les utilitaires de sécurisation SQL
 */

import { describe, it, expect } from "vitest";
import {
  escapeLikePattern,
  escapeSqlIdentifier,
  validateTableName,
  validateRegion,
} from "@/lib/sql-sanitization";

describe("SQL Sanitization", () => {
  describe("escapeLikePattern", () => {
    it("should escape percent signs", () => {
      expect(escapeLikePattern("test%value")).toBe("test\\%value");
      expect(escapeLikePattern("100%")).toBe("100\\%");
      expect(escapeLikePattern("%admin%")).toBe("\\%admin\\%");
    });

    it("should escape underscores", () => {
      expect(escapeLikePattern("test_value")).toBe("test\\_value");
      expect(escapeLikePattern("user_id")).toBe("user\\_id");
      expect(escapeLikePattern("_private")).toBe("\\_private");
    });

    it("should escape backslashes", () => {
      expect(escapeLikePattern("path\\to\\file")).toBe("path\\\\to\\\\file");
      expect(escapeLikePattern("\\")).toBe("\\\\");
    });

    it("should handle combined special characters", () => {
      expect(escapeLikePattern("%_\\")).toBe("\\%\\_\\\\");
      expect(escapeLikePattern("test%_value\\path")).toBe(
        "test\\%\\_value\\\\path"
      );
    });

    it("should leave normal strings unchanged", () => {
      expect(escapeLikePattern("normaltext")).toBe("normaltext");
      expect(escapeLikePattern("Hello World")).toBe("Hello World");
      expect(escapeLikePattern("user123")).toBe("user123");
    });

    it("should handle empty string", () => {
      expect(escapeLikePattern("")).toBe("");
    });

    it("should prevent LIKE injection attacks", () => {
      // Attempting SQL injection via LIKE
      const malicious = "'; DROP TABLE users; --";
      const escaped = escapeLikePattern(malicious);
      // The special SQL characters aren't LIKE metacharacters, but % and _ are
      expect(escaped).toBe("'; DROP TABLE users; --");

      // LIKE-specific injection attempts
      const likeInjection = "%admin%";
      expect(escapeLikePattern(likeInjection)).toBe("\\%admin\\%");
    });
  });

  describe("escapeSqlIdentifier", () => {
    it("should escape valid identifiers with double quotes", () => {
      expect(escapeSqlIdentifier("users")).toBe('"users"');
      expect(escapeSqlIdentifier("Champion")).toBe('"Champion"');
      expect(escapeSqlIdentifier("league_accounts_euw1")).toBe(
        '"league_accounts_euw1"'
      );
    });

    it("should allow identifiers starting with underscore", () => {
      expect(escapeSqlIdentifier("_private_table")).toBe('"_private_table"');
    });

    it("should throw error for identifiers with special characters", () => {
      expect(() => escapeSqlIdentifier("users; DROP TABLE")).toThrow(
        "Identifiant SQL invalide"
      );
      expect(() => escapeSqlIdentifier("table-name")).toThrow(
        "Identifiant SQL invalide"
      );
      expect(() => escapeSqlIdentifier("table.name")).toThrow(
        "Identifiant SQL invalide"
      );
      expect(() => escapeSqlIdentifier("table name")).toThrow(
        "Identifiant SQL invalide"
      );
    });

    it("should throw error for identifiers starting with numbers", () => {
      expect(() => escapeSqlIdentifier("123table")).toThrow(
        "Identifiant SQL invalide"
      );
      expect(() => escapeSqlIdentifier("1users")).toThrow(
        "Identifiant SQL invalide"
      );
    });

    it("should throw error for empty identifier", () => {
      expect(() => escapeSqlIdentifier("")).toThrow("Identifiant SQL invalide");
    });

    it("should prevent SQL injection via identifier", () => {
      expect(() => escapeSqlIdentifier('"; DROP TABLE users; --"')).toThrow(
        "Identifiant SQL invalide"
      );
      expect(() => escapeSqlIdentifier("users--")).toThrow(
        "Identifiant SQL invalide"
      );
    });
  });

  describe("validateTableName", () => {
    it("should accept valid table names", () => {
      expect(validateTableName("users")).toBe(true);
      expect(validateTableName("Champion")).toBe(true);
      expect(validateTableName("league_accounts_euw1")).toBe(true);
      expect(validateTableName("_private")).toBe(true);
      expect(validateTableName("Table123")).toBe(true);
    });

    it("should reject table names with special characters", () => {
      expect(validateTableName("users; DROP TABLE")).toBe(false);
      expect(validateTableName("table-name")).toBe(false);
      expect(validateTableName("table.name")).toBe(false);
      expect(validateTableName("table name")).toBe(false);
      expect(validateTableName("table'name")).toBe(false);
      expect(validateTableName('table"name')).toBe(false);
    });

    it("should reject table names starting with numbers", () => {
      expect(validateTableName("123table")).toBe(false);
      expect(validateTableName("1")).toBe(false);
    });

    it("should reject empty table names", () => {
      expect(validateTableName("")).toBe(false);
    });
  });

  describe("validateRegion", () => {
    it("should accept valid Riot regions", () => {
      expect(validateRegion("euw1")).toBe(true);
      expect(validateRegion("EUW1")).toBe(true);
      expect(validateRegion("na1")).toBe(true);
      expect(validateRegion("kr")).toBe(true);
      expect(validateRegion("br1")).toBe(true);
      expect(validateRegion("jp1")).toBe(true);
      expect(validateRegion("eun1")).toBe(true);
      expect(validateRegion("tr1")).toBe(true);
      expect(validateRegion("ru")).toBe(true);
      expect(validateRegion("la1")).toBe(true);
      expect(validateRegion("la2")).toBe(true);
      expect(validateRegion("oc1")).toBe(true);
    });

    it("should reject invalid regions", () => {
      expect(validateRegion("invalid")).toBe(false);
      expect(validateRegion("")).toBe(false);
      expect(validateRegion("eu")).toBe(false);
      expect(validateRegion("na")).toBe(false);
      expect(validateRegion("'; DROP TABLE users; --")).toBe(false);
    });

    it("should be case insensitive", () => {
      expect(validateRegion("EUW1")).toBe(true);
      expect(validateRegion("euw1")).toBe(true);
      expect(validateRegion("Euw1")).toBe(true);
    });
  });
});
