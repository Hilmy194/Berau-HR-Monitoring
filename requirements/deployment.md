# Deployment Guide: Vercel + Supabase

This guide is written specifically for this project.

Current state of the repo:
- Frontend/backend: `Next.js 15`
- Auth: `next-auth`
- ORM: `Prisma`
- Current local database: `SQLite`
- Target production database: `Supabase Postgres`

Important:
- The project cannot be deployed to Vercel with Supabase until Prisma is switched from `sqlite` to `postgresql`.
- Supabase should be used as the production database.
- Vercel should be used for the application hosting.

## 1. Push your latest code to GitHub

Make sure your branch is already pushed:

```powershell
git push origin main
```

## 2. Create a Supabase project

1. Open Supabase Dashboard.
2. Create a new project.
3. Wait until the database is ready.
4. Open:
   `Project Settings` -> `Database`
5. Copy the Postgres connection strings.

You usually need two connection strings for Prisma:
- `DATABASE_URL` for app runtime
- `DIRECT_URL` for Prisma migrations

Recommended pattern for Prisma with Supabase:
- `DATABASE_URL`: pooled connection
- `DIRECT_URL`: direct database connection

Reference:
- Vercel Git deployments: https://vercel.com/docs/git/vercel-for-github
- Vercel environment variables: https://vercel.com/docs/environment-variables
- Supabase Postgres connection guide: https://supabase.com/docs/guides/database/connecting-to-postgres
- Prisma migrate deploy: https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate

## 3. Update Prisma from SQLite to PostgreSQL

Open:
- `prisma/schema.prisma`

Change this:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

To this:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Notes:
- `directUrl` is strongly recommended for migrations.
- You do not need to rewrite your model fields just because the provider changes.

## 4. Update local `.env`

Replace the SQLite value:

```env
DATABASE_URL="file:./dev.db"
```

With Supabase values like this:

```env
DATABASE_URL="your_supabase_pooled_connection_string"
DIRECT_URL="your_supabase_direct_connection_string"
NEXTAUTH_SECRET="your-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

For production later on Vercel:
- `NEXTAUTH_URL` must be your real Vercel domain
- Example:
  `https://your-project.vercel.app`

## 5. Regenerate Prisma Client

Run:

```powershell
npx prisma generate
```

## 6. Create the PostgreSQL migration

Because this repo started from SQLite, the safest path is:

1. Keep your Prisma models as they are.
2. Point Prisma to Supabase Postgres.
3. Generate a fresh migration for PostgreSQL.

Run:

```powershell
npx prisma migrate dev --name init_postgres
```

If Prisma complains because old SQLite migration history does not match the new provider, use this practical approach:

1. Remove old local migration history only after you are sure you no longer need the SQLite migration chain.
2. Create a new clean PostgreSQL baseline migration.

Typical safe sequence:

```powershell
Remove-Item -Recurse -Force prisma\\migrations
mkdir prisma\\migrations
npx prisma migrate dev --name init_postgres
```

Important:
- Do this only once, while moving from SQLite development to PostgreSQL production.
- Commit the new PostgreSQL migration folder after it is generated.

## 7. Seed the Supabase database

If you want initial demo/admin data in Supabase, run:

```powershell
npm run db:seed
```

Before doing that, make sure:
- `DATABASE_URL` points to Supabase
- your migration has already been applied

## 8. Commit the PostgreSQL migration changes

Run:

```powershell
git add prisma/schema.prisma prisma/migrations .env.example
git commit -m "Switch Prisma to Supabase Postgres"
git push origin main
```

If you do not have `.env.example`, create one and include only variable names, not secrets.

Suggested `.env.example`:

```env
DATABASE_URL=""
DIRECT_URL=""
NEXTAUTH_SECRET=""
NEXTAUTH_URL=""
```

## 9. Import the repo into Vercel

1. Open Vercel.
2. Click `Add New...` -> `Project`.
3. Import your GitHub repository.
4. Select this project.
5. Keep framework as `Next.js`.

## 10. Add environment variables in Vercel

In Vercel project settings, add:

```env
DATABASE_URL=your_supabase_pooled_connection_string
DIRECT_URL=your_supabase_direct_connection_string
NEXTAUTH_SECRET=your-long-random-secret
NEXTAUTH_URL=https://your-project.vercel.app
```

Recommended:
- Add them to `Production`
- Add them to `Preview` too if you want preview deployments to work

## 11. Decide how migrations will run in production

You have two common options.

### Option A: Run migrations manually before first deploy

This is the simplest option for this project.

Run locally against Supabase:

```powershell
npx prisma migrate deploy
```

Then deploy to Vercel.

This works well when:
- you deploy manually
- schema changes are not frequent

### Option B: Run migrations in CI/CD

This is better for long-term production use.

Use GitHub Actions to run:

```powershell
npx prisma migrate deploy
```

Reason:
- Prisma documents recommend `migrate deploy` in CI/CD for production
- some platforms may prune devDependencies during build

In this repo, `prisma` is currently in `devDependencies`, so CI/CD is usually cleaner than trying to run migrations during the Vercel build itself.

## 12. Deploy on Vercel

After env vars are set:

1. Trigger deploy from Vercel dashboard, or
2. Push to `main`

Default build command from this repo is already:

```json
"build": "prisma generate && next build"
```

That is fine for Vercel.

## 13. Verify the production app

After deployment:

1. Open the Vercel URL.
2. Open `/login`.
3. Test sign in.
4. Register a new employee.
5. Complete profile setup.
6. Check that probation tasks are created automatically.
7. Check uploads and profile updates.
8. Verify admin pages can read/write data from Supabase.

## 14. Recommended production checklist

Before going live, confirm:

1. `NEXTAUTH_SECRET` is a strong random secret.
2. `NEXTAUTH_URL` matches the final Vercel domain or custom domain.
3. `DATABASE_URL` and `DIRECT_URL` point to Supabase production.
4. Prisma migrations have already been applied.
5. Seed data is removed or adjusted if you do not want demo users in production.
6. Upload storage strategy is reviewed.

## 15. Important note about uploads

This project currently stores uploaded files under:

```text
public/uploads
```

That works for local development, but it is not ideal for production serverless hosting on Vercel because filesystem writes are not persistent like a normal server.

For production, you should plan to move uploads to object storage such as:
- Supabase Storage
- Vercel Blob
- AWS S3

If you keep the current local-disk upload approach, uploaded files may not persist reliably in production.

## 16. Suggested deployment order

Use this order:

1. Create Supabase project
2. Switch Prisma provider to PostgreSQL
3. Add `DIRECT_URL`
4. Generate a fresh PostgreSQL migration
5. Apply migration to Supabase
6. Seed if needed
7. Push code to GitHub
8. Import repo to Vercel
9. Add environment variables
10. Deploy
11. Verify login, profile setup, tasks, and admin flows

## 17. Short answer for this repo

For this project, the safest deployment path is:

1. Migrate Prisma from SQLite to PostgreSQL first
2. Use Supabase Postgres for the database
3. Use Vercel only for the app hosting
4. Run `prisma migrate deploy` before or during CI
5. Move uploads away from `public/uploads` before serious production use
