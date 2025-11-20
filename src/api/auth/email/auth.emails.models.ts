import { db } from "../../../_db/dbInstance";

export async function setEmailVerificationToken(
  userId: number,
  token: string,
  expiresAt: Date
) {
  return db
    .updateTable("users")
    .set({
      email_verification_token: token,
      email_verification_expires_at: expiresAt,
    })
    .where("id", "=", userId)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function findUserByVerificationToken(token: string) {
  return db
    .selectFrom("users")
    .selectAll()
    .where("email_verification_token", "=", token)
    .where("email_verification_expires_at", ">", new Date())
    .executeTakeFirst();
}

export async function verifyUserEmail(userId: number) {
  return db
    .updateTable("users")
    .set({
      email_verified: true,
      email_verification_token: null,
      email_verification_expires_at: null,
    })
    .where("id", "=", userId)
    .returningAll()
    .executeTakeFirstOrThrow();
}
