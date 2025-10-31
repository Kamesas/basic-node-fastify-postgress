import crypto from "crypto";

function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("base64url");
}

export function generateVerificationToken(expiryHours: number = 24) {
  const token = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  return {
    token,
    expiresAt,
  };
}

export function generatePasswordResetToken(expiryHours: number = 1) {
  const token = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  return {
    token,
    expiresAt,
  };
}
