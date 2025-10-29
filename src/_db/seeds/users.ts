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
      { username: "Alice Johnson", email: "alice@example.com" },
      { username: "Bob Smith", email: "bob@example.com" },
      { username: "Charlie Brown", email: "charlie@example.com" },
      { username: "Diana Prince", email: "diana@example.com" },
      { username: "Eve Davis", email: "eve@example.com" },
      { username: "Frank Miller", email: "frank@example.com" },
      { username: "Grace Lee", email: "grace@example.com" },
      { username: "Henry Wilson", email: "henry@example.com" },
      { username: "Ivy Chen", email: "ivy@example.com" },
      { username: "Jack Roberts", email: "jack@example.com" },
    ])
    .execute();

  console.log("✅ Users seeded");
}
