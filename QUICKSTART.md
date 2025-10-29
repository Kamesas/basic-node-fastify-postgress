# 🚀 Quick Start - Database Setup

## ✅ What's Done

All packages installed and configured! Your Kysely setup is ready to go.

## 🎯 Quick Start (5 steps)

### Step 1: Create `.env` file

```bash
# Create .env in project root
touch .env
```

Add this line to `.env`:

```
DATABASE_URL=postgresql://username:password@localhost:5432/basic_back
```

**Don't have PostgreSQL yet?** Use a free cloud database:

- **Neon**: https://neon.tech (recommended, instant setup)
- **Supabase**: https://supabase.com
- **Railway**: https://railway.app

### Step 2: Run Migration

```bash
npm run db:migrate:up
```

Expected output:

```
✅ Migration "001_create_users_table" was executed successfully
```

### Step 3: Generate Types

```bash
npm run db:types
```

This creates `src/_db/dbTypes.ts` with your database schema.

### Step 4: (Optional) Run Seeds

```bash
npm run db:seed
```

This adds 3 sample users to your database.

### Step 5: Use Kysely in Your Code!

Update `src/api/users/users.models.ts`:

```typescript
import { db } from "../_db/dbInstance";

export async function getUsers() {
  return await db.selectFrom("users").selectAll().execute();
}

export async function createUser(userData: { name: string; email: string }) {
  return await db
    .insertInto("users")
    .values(userData)
    .returningAll()
    .executeTakeFirstOrThrow();
}
```

## 📝 Available Commands

```bash
# Database migrations
npm run db:migrate:up      # Run migrations
npm run db:migrate:down    # Rollback last migration

# Type generation
npm run db:types           # Generate TypeScript types from DB

# Seeds
npm run db:seed            # Populate database with sample data
```

## 📚 Files Overview

- `src/_db/dbInstance.ts` - Database connection
- `src/_db/dbTypes.ts` - Auto-generated types
- `src/_db/migrations/` - Migration files
- `src/_db/seeds/` - Seed files

## ⚡ That's It!

Read `DATABASE_SETUP.md` for detailed documentation.

Your database is ready for production! 🎉
