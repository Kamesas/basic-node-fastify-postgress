# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development with hot reload
npm run dev                # Compiles TypeScript in watch mode + restarts Fastify on changes

# Production
npm start                  # Build once and start production server

# Build
npm run build:ts           # Compile TypeScript to dist/
npm run watch:ts           # Compile TypeScript in watch mode only

# Testing
npm test                   # Build, compile tests, run with coverage via c8

# Database operations
npm run db:migrate:up      # Apply pending migrations
npm run db:migrate:down    # Rollback last migration
npm run db:types           # Regenerate TypeScript types from database schema
npm run db:seed            # Populate database with seed data
```

## Architecture Overview

### Application Structure

**Fastify + Kysely + PostgreSQL stack** with TypeScript. The application uses a plugin-based architecture where domain logic is organized into feature modules.

- **Entry point**: `src/app.ts` - Registers plugins, security middleware (Helmet), Zod validation, and routes
- **Server start**: Fastify CLI starts from `dist/app.js` after TypeScript compilation
- **Type safety**: Uses `fastify-type-provider-zod` for request/response validation and Kysely for database operations

### Domain Organization

Routes are grouped by feature in `src/api/`:
- **auth/** - Authentication flows (register, login, logout, password reset, email verification, OAuth)
- **users/** - User CRUD operations

Each domain module typically contains:
- `*.routes.ts` - Route handlers and HTTP layer
- `*.models.ts` - Database queries (Kysely)
- `*.schemas.ts` - Zod validation schemas

### Authentication Architecture

Multi-provider authentication system with JWT tokens:

1. **Auth Providers Table** (`auth_providers`): Supports multiple authentication methods per user
   - `provider_type`: "email", "google", etc.
   - `password_hash`: Stored only for email provider (Argon2)
   - `provider_user_id`: External provider ID for OAuth
   - Constraints ensure one provider type per user

2. **Token Strategy**:
   - Access tokens (default: 15m expiry) - Used for API authentication
   - Refresh tokens (default: 30d expiry) - Stored in database with hash
   - Refresh tokens track device info (user-agent) and support revocation

3. **Auth Plugin** (`src/plugins/auth.ts`):
   - Decorates `fastify.jwt` with sign/verify methods
   - Provides `fastify.authenticate` preHandler for protected routes
   - Adds `request.user` with decoded JWT payload

4. **Email Flow**:
   - Registration generates verification token (stored in users table)
   - Login blocked until email verified
   - Password reset uses separate token with expiration

### Database Layer

**Kysely query builder** with PostgreSQL:

- **Connection**: Singleton instance in `src/_db/dbInstance.ts` using connection pool
- **Migrations**: Located in `src/_db/migrations/`, numbered sequentially (001_, 002_, etc.)
- **Type Generation**: `npm run db:types` creates `src/_db/dbTypes.ts` from schema
- **Schema**:
  - `users` - Core user data, email verification state, password reset tokens
  - `auth_providers` - Multi-provider authentication (email, OAuth)
  - `refresh_tokens` - Refresh token storage with revocation support

### Plugin System

Plugins in `src/plugins/` are auto-loaded via `@fastify/autoload`:
- **auth.ts** - JWT authentication and `fastify.authenticate` decorator
- **oauth.ts** - OAuth2 provider configuration (Google)
- **sensible.ts** - Fastify sensible plugin (useful HTTP responses)
- **support.ts** - Custom utilities and decorators

### Configuration

Centralized in `src/config.ts` with environment variable validation:
- **Required**: `DATABASE_URL`, `JWT_SECRET`
- **Optional**: JWT expiry times, Argon2 parameters, email settings, `FRONTEND_URL`
- Exports `config` object and environment helpers (`isDevelopment`, `isProduction`, `isTest`)

## Key Implementation Details

### Adding New Routes

1. Create route file in appropriate `src/api/<domain>/` directory
2. Define Zod schemas in `<domain>.schemas.ts`
3. Implement database queries in `<domain>.models.ts` using Kysely
4. Register route in main routes file or `src/app.ts`

Example protected route:
```typescript
f.get('/protected', {
  preHandler: [fastify.authenticate],
  schema: mySchema
}, async (request, reply) => {
  const userId = request.user!.userId; // Available after authenticate
  // ...
});
```

### Database Migrations

After modifying schema:
```bash
# 1. Create migration file
touch src/_db/migrations/004_description.ts

# 2. Implement up() and down() functions

# 3. Apply migration
npm run db:migrate:up

# 4. Regenerate types (critical - types won't update automatically)
npm run db:types
```

Migration files export `up()` and `down()` async functions receiving Kysely instance.

### Authentication Flow

**Register → Email Verification → Login → Access/Refresh Tokens**

- New registrations create user + email provider record
- Verification token sent via email (configured in `config.email`)
- Login returns both access and refresh tokens
- Use `/auth/refresh` endpoint to get new access token with refresh token
- Logout endpoints support single session (`/logout`) or all sessions (`/logout/all`)

### Type Safety

- Route schemas use Zod with `ZodTypeProvider`
- Database types auto-generated from schema via `kysely-codegen`
- JWT payload typed as `tJwtPayload` in `src/utils/jwt.ts`
- Fastify instance augmented with custom decorators via declaration merging

## Testing

Tests use Node's built-in test runner with `c8` coverage:
- Located in `test/routes/` and `test/plugins/`
- Use `test/helper.ts` to build test Fastify instances
- Run with `npm test` (compiles TypeScript first)

## Environment Setup

Required `.env` file:
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/basic_back
JWT_SECRET=your-secret-key-change-this

# Optional
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d
FRONTEND_URL=http://localhost:3000
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your-user
EMAIL_PASS=your-pass
FROM_EMAIL=noreply@example.com
```

See `QUICKSTART.md` and `DATABASE_SETUP.md` for detailed setup instructions.

## Code Style

- Uses neostandard + Prettier (double quotes, semicolons, trailing commas)
- camelCase for functions/variables, PascalCase for classes/Zod schemas
- Route directories match URL structure (`src/api/auth/` → `/api/auth/*`)
- Generated files (`dist/`, `src/_db/dbTypes.ts`) are not committed
