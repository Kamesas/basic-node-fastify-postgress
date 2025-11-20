import { Kysely } from "kysely";
import { DB } from "../dbTypes";

export async function seedUsers(db: Kysely<DB>) {
  const existingUsers = await db.selectFrom("users").selectAll().execute();

  if (existingUsers.length > 0) {
    console.log("⚠️  Users already exist, skipping seed");
    return;
  }

  await db
    .insertInto("users")
    .values([
      { username: "alice_johnson", email: "alice@example.com" },
      { username: "bob_smith", email: "bob@example.com" },
      { username: "charlie_brown", email: "charlie@example.com" },
      { username: "diana_prince", email: "diana@example.com" },
      { username: "eve_davis", email: "eve@example.com" },
      { username: "frank_miller", email: "frank@example.com" },
      { username: "grace_lee", email: "grace@example.com" },
      { username: "henry_wilson", email: "henry@example.com" },
      { username: "ivy_chen", email: "ivy@example.com" },
      { username: "jack_roberts", email: "jack@example.com" },
    ])
    .execute();

  console.log("✅ Users seeded");
}
