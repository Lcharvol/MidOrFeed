/**
 * Tests pour l'utilitaire email (nodemailer)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mockSendMail = vi.fn().mockResolvedValue({ messageId: "test-id" });

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
    })),
  },
}));

describe("Email Utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env vars
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
    delete process.env.NEXT_PUBLIC_APP_URL;

    // Need to re-import to get fresh module state
    vi.resetModules();
  });

  describe("sendEmail", () => {
    it("should return false and log warning when SMTP is not configured", async () => {
      const { sendEmail } = await import("@/lib/email");
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result).toBe(false);
    });

    it("should send email when SMTP is configured", async () => {
      process.env.SMTP_HOST = "smtp.test.com";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user@test.com";
      process.env.SMTP_PASS = "password123";
      process.env.SMTP_FROM = "noreply@test.com";

      const { sendEmail } = await import("@/lib/email");
      const result = await sendEmail({
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Hello</p>",
        text: "Hello",
      });

      expect(result).toBe(true);
      expect(mockSendMail).toHaveBeenCalledWith({
        from: "noreply@test.com",
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Hello</p>",
        text: "Hello",
      });
    });

    it("should return false when sendMail throws", async () => {
      process.env.SMTP_HOST = "smtp.test.com";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user@test.com";
      process.env.SMTP_PASS = "password123";

      mockSendMail.mockRejectedValueOnce(new Error("SMTP connection refused"));

      const { sendEmail } = await import("@/lib/email");
      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result).toBe(false);
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("should call sendEmail with reset URL containing token", async () => {
      process.env.SMTP_HOST = "smtp.test.com";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user@test.com";
      process.env.SMTP_PASS = "password123";
      process.env.NEXT_PUBLIC_APP_URL = "https://myapp.com";

      const { sendPasswordResetEmail } = await import("@/lib/email");
      await sendPasswordResetEmail("user@example.com", "abc123token");

      expect(mockSendMail).toHaveBeenCalledOnce();
      const call = mockSendMail.mock.calls[0][0];
      expect(call.to).toBe("user@example.com");
      expect(call.subject).toContain("mot de passe");
      expect(call.html).toContain("https://myapp.com/reset-password?token=abc123token");
      expect(call.text).toContain("https://myapp.com/reset-password?token=abc123token");
    });

    it("should default to localhost when NEXT_PUBLIC_APP_URL is not set", async () => {
      process.env.SMTP_HOST = "smtp.test.com";
      process.env.SMTP_PORT = "587";
      process.env.SMTP_USER = "user@test.com";
      process.env.SMTP_PASS = "password123";

      const { sendPasswordResetEmail } = await import("@/lib/email");
      await sendPasswordResetEmail("user@example.com", "token123");

      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).toContain("http://localhost:3000/reset-password?token=token123");
    });
  });
});
