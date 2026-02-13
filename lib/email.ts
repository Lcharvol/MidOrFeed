import nodemailer from "nodemailer";
import { logger } from "./logger";
import { toError } from "./errors";

/**
 * Email utility for transactional emails (password reset, etc.)
 *
 * Required env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * If SMTP env vars are missing the send functions log a warning
 * and return false so callers degrade gracefully.
 */

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!transporter) {
    logger.warn("SMTP not configured — skipping email send", {
      to: options.to,
      subject: options.subject,
    });
    return false;
  }

  try {
    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    logger.info("Email sent", { to: options.to, subject: options.subject });
    return true;
  } catch (error) {
    logger.error("Failed to send email", toError(error), {
      to: options.to,
      subject: options.subject,
    });
    return false;
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string
): Promise<boolean> => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  return sendEmail({
    to: email,
    subject: "Réinitialisation de votre mot de passe",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Réinitialisation de mot de passe</h2>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px;">
            Réinitialiser mon mot de passe
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
        </p>
      </div>
    `,
    text: `Réinitialisation de votre mot de passe\n\nCliquez sur ce lien : ${resetUrl}\n\nCe lien expire dans 1 heure.`,
  });
};
