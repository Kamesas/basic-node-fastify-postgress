# Database Setup Guide - Kysely + PostgreSQL

## ✅ What's Installed

All packages are now installed:

- ✅ `kysely` - TypeScript SQL query builder
- ✅ `pg` - PostgreSQL client
- ✅ `dotenv` - Environment variables
- ✅ `kysely-codegen` - Auto-generate TypeScript types from database
- ✅ `tsx` - Run TypeScript files directly
- ✅ `@types/pg` - TypeScript types for pg

## 📁 File Structure

```
src/_db/
├── dbInstance.ts        ← Database connection instance
├── dbTypes.ts           ← Auto-generated types (run npm run db:types)
├── migrator.ts          ← Migration runner
├── runSeeds.ts          ← Seed runner
├── migrations/          ← SQL migrations go here
└── seeds/               ← Seed files go here
```

## 🔧 Setup Steps

### 1. Create PostgreSQL Database

You need a PostgreSQL database. Options:

**Local PostgreSQL:**

```bash
# macOS with Homebrew
brew install postgresql
brew services start postgresql
createdb basic_back

# Linux
sudo apt-get install postgresql
sudo systemctl start postgresql
sudo -u postgres createdb basic_back
```

**Docker:**

```bash
docker run --name postgres-dev -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
docker exec -it postgres-dev createdb -U postgres basic_back
```

**Cloud (recommended for production):**

- [Neon](https://neon.tech) - Free PostgreSQL (serverless)
- [Supabase](https://supabase.com) - Free tier with PostgreSQL
- [Railway](https://railway.app) - Easy deployment

### 2. Create .env File

Create `.env` in the project root:

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/basic_back

# Example for local PostgreSQL:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/basic_back

# Example for Neon/Supabase (you'll get this from their dashboard):
DATABASE_URL=postgresql://user:pass@host.region.provider.com/dbname?sslmode=require
```

### 3. Create Your First Migration

```bash
# Create a migration file manually
touch src/_db/migrations/001_create_users_table.ts
```

Example migration content:

```typescript
import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("users")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "varchar(100)", (col) => col.notNull())
    .addColumn("email", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("created_at", "timestamp", (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();

  // Create index for better performance
  await db.schema
    .createIndex("users_email_index")
    .on("users")
    .column("email")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("users").execute();
}
```

### 4. Run Migration

```bash
npm run db:migrate:up
```

Expected output:

```
✅ Migration "001_create_users_table" was executed successfully
```

### 5. Generate TypeScript Types

```bash
npm run db:types
```

This will generate `src/_db/dbTypes.ts` with your database schema:

```typescript
export interface DB {
  users: {
    id: Generated<number>;
    name: string;
    email: string;
    created_at: Generated<Timestamp>;
  };
}
```

### 6. Use the Database in Your Code

```typescript
import { db } from "./_db/dbInstance";

// Query users
const users = await db.selectFrom("users").selectAll().execute();

// Insert user
const newUser = await db
  .insertInto("users")
  .values({
    name: "John Doe",
    email: "john@example.com",
  })
  .returningAll()
  .executeTakeFirstOrThrow();

// Update user
await db
  .updateTable("users")
  .set({ name: "Jane Doe" })
  .where("id", "=", 1)
  .execute();

// Delete user
await db.deleteFrom("users").where("id", "=", 1).execute();
```

## 📝 NPM Scripts Available

```bash
# Generate TypeScript types from database schema
npm run db:types

# Run all pending migrations (up)
npm run db:migrate:up

# Rollback last migration (down)
npm run db:migrate:down

# Run seeds (populate database with initial data)
npm run db:seed
```

## 🌱 Creating Seeds

Create seed files in `src/_db/seeds/`:

```typescript
// src/_db/seeds/users.ts
import { Kysely } from "kysely";
import { DB } from "../dbTypes";

export async function seedUsers(db: Kysely<DB>) {
  await db
    .insertInto("users")
    .values([
      { name: "Alice", email: "alice@example.com" },
      { name: "Bob", email: "bob@example.com" },
      { name: "Charlie", email: "charlie@example.com" },
    ])
    .execute();

  console.log("✅ Users seeded");
}
```

Then import in `runSeeds.ts`:

```typescript
import { db } from "./dbInstance";
import { seedUsers } from "./seeds/users";

async function runSeeds() {
  try {
    console.log("Starting seeds...");

    await seedUsers(db);

    console.log("All seeds completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

runSeeds();
```

## 🔄 Migration Workflow

```bash
# 1. Create migration
touch src/_db/migrations/002_add_posts_table.ts

# 2. Write up() and down() functions in the migration

# 3. Run migration
npm run db:migrate:up

# 4. Generate types
npm run db:types

# 5. Use new tables in your code!
```

## ⚠️ Common Issues

### Issue: "Cannot connect to database"

**Solution:** Check your `.env` file and make sure PostgreSQL is running

### Issue: "dbTypes.ts is empty"

**Solution:** Run migrations first, then run `npm run db:types`

### Issue: "Migration failed"

**Solution:** Check migration syntax. Run `npm run db:migrate:down` to rollback, fix, and try again

### Issue: "\_\_dirname is not defined"

**Solution:** Already fixed! Using CommonJS-compatible approach

## 🎯 Next Steps

1. ✅ Create `.env` with `DATABASE_URL`
2. ✅ Create your first migration
3. ✅ Run `npm run db:migrate:up`
4. ✅ Run `npm run db:types`
5. ✅ Update `users.models.ts` to use Kysely instead of mock data
6. ✅ Test with real database!

## 📚 Useful Resources

- [Kysely Documentation](https://kysely.dev/)
- [Kysely Examples](https://github.com/kysely-org/kysely/tree/master/examples)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## 🚀 Production Ready

Your setup is production-ready with:

- ✅ Type-safe queries
- ✅ Migration system
- ✅ Seed system
- ✅ Auto-generated types
- ✅ Connection pooling
- ✅ Environment variables

Perfect for apps with millions of users! 🎉
