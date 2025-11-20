import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE users (
      id serial primary key,
      username varchar(100) unique not null,
      email varchar(255) unique,
      email_verified boolean not null default false,
      email_verification_token varchar(255),
      email_verification_expires_at timestamptz,
      display_name varchar(255),
      avatar_url varchar(500),
      password_reset_token varchar(255),
      password_reset_expires_at timestamptz,
      is_active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `.execute(db);

  console.log("✅ Created users table");
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE users CASCADE`.execute(db);
  console.log("✅ Dropped users table");
}
