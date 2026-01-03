/**
 * Tests pour la validation des mots de passe
 * Les règles de mot de passe sont définies dans les routes d'authentification
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Reproduire le schéma de validation utilisé dans l'application
const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
  .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre");

describe("Password Validation", () => {
  describe("valid passwords", () => {
    it("should accept password with all required criteria", () => {
      const validPasswords = [
        "Password1",
        "MySecure123",
        "Test1234",
        "Abcdefg1",
        "ComplexP@ss1",
        "VeryLongPassword123",
      ];

      validPasswords.forEach((password) => {
        const result = passwordSchema.safeParse(password);
        expect(result.success, `Password "${password}" should be valid`).toBe(
          true
        );
      });
    });

    it("should accept passwords with special characters", () => {
      const result = passwordSchema.safeParse("P@ssw0rd!");
      expect(result.success).toBe(true);
    });

    it("should accept long passwords", () => {
      const result = passwordSchema.safeParse(
        "VeryVeryVeryLongSecurePassword123"
      );
      expect(result.success).toBe(true);
    });
  });

  describe("invalid passwords - length", () => {
    it("should reject passwords shorter than 8 characters", () => {
      const shortPasswords = ["Pass1", "Ab1", "Aa1234"];

      shortPasswords.forEach((password) => {
        const result = passwordSchema.safeParse(password);
        expect(result.success, `Password "${password}" should be rejected`).toBe(
          false
        );
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("8 caractères");
        }
      });
    });

    it("should reject empty password", () => {
      const result = passwordSchema.safeParse("");
      expect(result.success).toBe(false);
    });
  });

  describe("invalid passwords - missing uppercase", () => {
    it("should reject passwords without uppercase letters", () => {
      const noUppercase = ["password123", "lowercase1", "12345678a"];

      noUppercase.forEach((password) => {
        const result = passwordSchema.safeParse(password);
        expect(
          result.success,
          `Password "${password}" should be rejected for missing uppercase`
        ).toBe(false);
        if (!result.success) {
          const hasUppercaseError = result.error.issues.some((issue) =>
            issue.message.toLowerCase().includes("majuscule")
          );
          expect(hasUppercaseError).toBe(true);
        }
      });
    });
  });

  describe("invalid passwords - missing lowercase", () => {
    it("should reject passwords without lowercase letters", () => {
      const noLowercase = ["PASSWORD123", "UPPERCASE1", "12345678A"];

      noLowercase.forEach((password) => {
        const result = passwordSchema.safeParse(password);
        expect(
          result.success,
          `Password "${password}" should be rejected for missing lowercase`
        ).toBe(false);
        if (!result.success) {
          const hasLowercaseError = result.error.issues.some((issue) =>
            issue.message.toLowerCase().includes("minuscule")
          );
          expect(hasLowercaseError).toBe(true);
        }
      });
    });
  });

  describe("invalid passwords - missing number", () => {
    it("should reject passwords without numbers", () => {
      const noNumbers = ["PasswordABC", "SecurePass", "NoDigitsHere"];

      noNumbers.forEach((password) => {
        const result = passwordSchema.safeParse(password);
        expect(
          result.success,
          `Password "${password}" should be rejected for missing number`
        ).toBe(false);
        if (!result.success) {
          const hasNumberError = result.error.issues.some((issue) =>
            issue.message.toLowerCase().includes("chiffre")
          );
          expect(hasNumberError).toBe(true);
        }
      });
    });
  });

  describe("edge cases", () => {
    it("should handle unicode characters", () => {
      // Password with unicode but still valid pattern
      const result = passwordSchema.safeParse("Password1éàü");
      expect(result.success).toBe(true);
    });

    it("should handle passwords with spaces", () => {
      // Spaces are valid characters
      const result = passwordSchema.safeParse("Pass word 1");
      expect(result.success).toBe(true);
    });

    it("should reject passwords that only meet some criteria", () => {
      // Only lowercase and numbers
      expect(passwordSchema.safeParse("password123").success).toBe(false);

      // Only uppercase and numbers
      expect(passwordSchema.safeParse("PASSWORD123").success).toBe(false);

      // Only letters, no numbers
      expect(passwordSchema.safeParse("PasswordABC").success).toBe(false);
    });
  });
});
