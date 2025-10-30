import { db } from "../../_db/dbInstance";
import { JsonValue } from "../../_db/dbTypes";
import { tRegisterInput } from "./auth.schemas";

export const PROVIDER_TYPES = {
  EMAIL: "email",
} as const;

export async function findUserByUsername(username: string) {
  return db
    .selectFrom("users")
    .selectAll()
    .where("username", "=", username)
    .executeTakeFirst();
}

export async function findUserByEmail(email: string) {
  return db
    .selectFrom("users")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst();
}

type tRegisterEmailUserInput = {
  username: tRegisterInput["username"];
  email?: tRegisterInput["email"];
  displayName?: tRegisterInput["displayName"];
  passwordHash: string;
};

export async function registerEmailUser(data: tRegisterEmailUserInput) {
  return db.transaction().execute(async (trx) => {
    const user = await trx
      .insertInto("users")
      .values({
        username: data.username,
        email: data.email,
        display_name: data.displayName,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const authProvider = await trx
      .insertInto("auth_providers")
      .values({
        user_id: user.id,
        provider_type: PROVIDER_TYPES.EMAIL,
        password_hash: data.passwordHash,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      user,
      authProvider,
    };
  });
}

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
