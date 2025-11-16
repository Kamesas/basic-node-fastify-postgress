import { db } from "../../../_db/dbInstance";
import { PROVIDER_TYPES } from "../auth.models";

export async function findUserByGoogleId(googleId: string) {
  return db
    .selectFrom("users")
    .innerJoin("auth_providers", "auth_providers.user_id", "users.id")
    .selectAll("users")
    .select(["auth_providers.provider_user_id", "auth_providers.provider_data"])
    .where("auth_providers.provider_type", "=", PROVIDER_TYPES.GOOGLE)
    .where("auth_providers.provider_user_id", "=", googleId)
    .executeTakeFirst();
}

type tRegisterGoogleUserInput = {
  googleId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  providerData?: Record<string, any>;
};

export async function loginOrRegisterWithGoogle(
  data: tRegisterGoogleUserInput
) {
  return db.transaction().execute(async (trx) => {
    const existingUser = await trx
      .selectFrom("users")
      .selectAll()
      .where("email", "=", data.email)
      .executeTakeFirst();

    let user;

    if (existingUser) {
      const existingProvider = await trx
        .selectFrom("auth_providers")
        .selectAll()
        .where("user_id", "=", existingUser.id)
        .where("provider_type", "=", PROVIDER_TYPES.GOOGLE)
        .executeTakeFirst();

      if (existingProvider) {
        return { user: existingUser, authProvider: existingProvider };
      }

      user = existingUser;
    } else {
      const username = data.email.split("@")[0] + "_" + Date.now();
      user = await trx
        .insertInto("users")
        .values({
          username,
          email: data.email,
          email_verified: true,
          display_name: data.displayName,
          avatar_url: data.avatarUrl,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    const authProvider = await trx
      .insertInto("auth_providers")
      .values({
        user_id: user.id,
        provider_type: PROVIDER_TYPES.GOOGLE,
        provider_user_id: data.googleId,
        provider_data: data.providerData || null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      user,
      authProvider,
    };
  });
}
