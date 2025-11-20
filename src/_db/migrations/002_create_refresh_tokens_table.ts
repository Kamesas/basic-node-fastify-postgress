import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE refresh_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ,
      device_info JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.execute(db);

  await sql`
    CREATE INDEX refresh_tokens_user_id_index ON refresh_tokens (user_id)
  `.execute(db);

  console.log("✅ Created refresh_tokens table");
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE refresh_tokens CASCADE`.execute(db);
  console.log("✅ Dropped refresh_tokens table");
}
