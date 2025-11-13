import { db } from "../../_db/dbInstance";
import { JsonValue } from "../../_db/dbTypes";
import { argonHash } from "../../utils/argon";

type tStoreRefreshTokenInput = {
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  deviceInfo?: JsonValue | null;
};

export async function storeRefreshToken(data: tStoreRefreshTokenInput) {
  return db
    .insertInto("refresh_tokens")
    .values({
      user_id: data.userId,
      token_hash: data.tokenHash,
      expires_at: data.expiresAt,
      device_info: (data.deviceInfo as JsonValue) || null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function findRefreshToken(tokenHash: string) {
  return db
    .selectFrom("refresh_tokens")
    .selectAll()
    .where("token_hash", "=", tokenHash)
    .where("revoked_at", "is", null)
    .executeTakeFirst();
}

export async function findRefreshTokensByUserId(userId: number) {
  return db
    .selectFrom("refresh_tokens")
    .selectAll()
    .where("user_id", "=", userId)
    .where("revoked_at", "is", null)
    .execute();
}

export async function deleteRefreshToken(id: number) {
  return db
    .deleteFrom("refresh_tokens")
    .where("id", "=", id)
    .executeTakeFirst();
}

export async function deleteRefreshTokensByUserId(userId: number) {
  return db
    .deleteFrom("refresh_tokens")
    .where("user_id", "=", userId)
    .execute();
}

export async function storeTokens(
  userId: number,
  refreshToken: string,
  userAgent: string | undefined
) {
  await storeRefreshToken({
    userId,
    tokenHash: await argonHash(refreshToken),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    deviceInfo: userAgent ? { userAgent } : null,
  });
}
