import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.execute(db);

  await sql`
    CREATE INDEX users_email_index ON users (email)
  `.execute(db);

  console.log("✅ Created users table");
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE users`.execute(db);
  console.log("✅ Dropped users table");
}
