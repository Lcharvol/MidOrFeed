import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { requireCsrf } from "@/lib/csrf";
import { logger } from "@/lib/logger";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
});

/**
 * POST /api/auth/forgot-password
 * Generate a password reset token and (TODO) send it by email.
 * Always returns 200 to avoid leaking whether the email exists.
 */
export async function POST(request: NextRequest) {
  // CSRF validation
  const csrfError = await requireCsrf(request);
  if (csrfError) return csrfError;

  const rateLimitResponse = await rateLimit(request, rateLimitPresets.auth);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json().catch(() => null);
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      // Always return generic success to avoid email enumeration
      return NextResponse.json({ success: true, message: "Si un compte existe, un email de réinitialisation a été envoyé." });
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    if (user) {
      // Invalidate any existing tokens for this user
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      // Generate a secure token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      });

      // TODO: Send email with reset link
      // const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
      // await sendEmail({ to: email, subject: "Reset password", resetUrl });
      logger.info("Password reset token generated", { userId: user.id });
    }

    return NextResponse.json({
      success: true,
      message: "Si un compte existe, un email de réinitialisation a été envoyé.",
    });
  } catch (error) {
    logger.error("Forgot password error", error as Error);
    return NextResponse.json(
      { success: true, message: "Si un compte existe, un email de réinitialisation a été envoyé." }
    );
  }
}
