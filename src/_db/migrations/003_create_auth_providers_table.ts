import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE auth_providers (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider_type VARCHAR(50) NOT NULL,
      provider_user_id VARCHAR(255),
      password_hash VARCHAR(255),
      password_changed_at TIMESTAMPTZ,
      provider_data JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT auth_providers_provider_unique UNIQUE (provider_type, provider_user_id),
      CONSTRAINT auth_providers_user_provider_unique UNIQUE (user_id, provider_type)
    )
  `.execute(db);

  console.log("✅ Created auth_providers table");
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE auth_providers CASCADE`.execute(db);
  console.log("✅ Dropped auth_providers table");
}
