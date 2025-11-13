import { db } from "../../_db/dbInstance";
import { tRegisterInput } from "./auth.schemas";

export const PROVIDER_TYPES = {
  EMAIL: "email",
  GOOGLE: "google",
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

export async function findUserByUsernameOrEmail(
  username: string,
  email: string
) {
  return db
    .selectFrom("users")
    .selectAll()
    .where((eb) =>
      eb.or([eb("username", "=", username), eb("email", "=", email)])
    )
    .executeTakeFirst();
}

export async function findUserWithEmailProvider(email: string) {
  return db
    .selectFrom("users")
    .innerJoin("auth_providers", "auth_providers.user_id", "users.id")
    .selectAll("users")
    .select(["auth_providers.password_hash"])
    .where("users.email", "=", email)
    .where("auth_providers.provider_type", "=", PROVIDER_TYPES.EMAIL)
    .executeTakeFirst();
}

type tRegisterEmailUserInput = {
  username: tRegisterInput["username"];
  email?: tRegisterInput["email"];
  displayName?: tRegisterInput["displayName"];
  passwordHash: string;
};

export async function registerWithEmail(data: tRegisterEmailUserInput) {
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
