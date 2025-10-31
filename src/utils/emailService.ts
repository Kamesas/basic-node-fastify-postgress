import { sendEmail } from "./nodeMailer";
import { config } from "../config";

export async function sendVerificationEmail(
  email: string,
  token: string,
  displayName?: string | null,
  username?: string
) {
  const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;
  const name = displayName || username || "there";

  await sendEmail({
    to: email,
    subject: "Verify your email",
    html: `
      <h1>Welcome ${name}!</h1>
      <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationUrl}">Verify Email</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create this account, please ignore this email.</p>
    `,
    text: `Welcome ${name}! Thank you for registering. Please verify your email address by visiting: ${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create this account, please ignore this email.`,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  displayName?: string | null,
  username?: string
) {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
  const name = displayName || username || "there";

  await sendEmail({
    to: email,
    subject: "Reset your password",
    html: `
      <h1>Password Reset Request</h1>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the link below to reset it:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
    `,
    text: `Hi ${name},\n\nWe received a request to reset your password. Visit this link to reset it: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`,
  });
}
