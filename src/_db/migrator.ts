import "dotenv/config";
import { promises as fs } from "fs";
import {
  FileMigrationProvider,
  Kysely,
  Migrator,
  PostgresDialect,
} from "kysely";
import { DB } from "./dbTypes";
import * as path from "path";
import { Pool } from "pg";

// For CommonJS, __dirname is available directly
const migrationsPath = path.join(__dirname, "migrations");

async function migrateToLatest() {
  const db = new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    }),
  });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: migrationsPath,
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(
        `✅ Migration "${it.migrationName}" was executed successfully`
      );
    } else if (it.status === "Error") {
      console.error(`❌ Failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error("❌ Failed to migrate");
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
}

async function migrateDown() {
  const db = new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    }),
  });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: migrationsPath,
    }),
  });

  const { error, results } = await migrator.migrateDown();

  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(
        `✅ Migration "${it.migrationName}" was reverted successfully`
      );
    } else if (it.status === "Error") {
      console.error(`❌ Failed to revert migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error("❌ Failed to revert migration");
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
}

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL is not set in .env file");
  console.error("Please create a .env file with:");
  console.error(
    "DATABASE_URL=postgresql://username:password@localhost:5432/dbname"
  );
  process.exit(1);
}

const command = process.argv[2];

async function main() {
  if (command === "up") {
    await migrateToLatest();
  } else if (command === "down") {
    await migrateDown();
  } else {
    console.log("Usage: tsx src/_db/migrator.ts up|down");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
