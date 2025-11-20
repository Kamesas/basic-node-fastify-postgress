import { Kysely } from "kysely";
import { db } from "../../../_db/dbInstance";
import { DB } from "../../../_db/dbTypes";
import { PROVIDER_TYPES } from "../auth.models";

export async function storePasswordResetToken(
  userId: number,
  tokenHash: string,
  expiresAt: Date
) {
  return db
    .updateTable("users")
    .where("id", "=", userId)
    .set({
      password_reset_token: tokenHash,
      password_reset_expires_at: expiresAt,
    })
    .execute();
}

export async function updateUserPassword(
  userId: number,
  passwordHash: string,
  trx?: Kysely<DB>
) {
  const now = new Date(); // TODO: need to adjaust updatet_at for the whole project
  const executor = trx ?? db;

  return executor
    .updateTable("auth_providers")
    .set({
      password_hash: passwordHash,
      password_changed_at: now,
      updated_at: now,
    })
    .where("user_id", "=", userId)
    .where("provider_type", "=", PROVIDER_TYPES.EMAIL)
    .returning(["id"])
    .executeTakeFirst();
}

export async function deletePasswordResetToken(
  userId: number,
  trx?: Kysely<DB>
) {
  const now = new Date();
  const executor = trx ?? db;

  return executor
    .updateTable("users")
    .set({
      password_reset_token: null,
      password_reset_expires_at: null,
      updated_at: now,
    })
    .where("id", "=", userId)
    .returning(["id"])
    .executeTakeFirst();
}
