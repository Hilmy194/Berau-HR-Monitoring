# Deployment Guide: Vercel + Supabase

This guide matches the current repository state.

## Current repo status

- Prisma provider is already `postgresql`
- `.env.example` already exists
- PostgreSQL baseline migration already exists in:
  `prisma/migrations/20260622130000_init_postgres`
- `.env` is already ignored by Git, so it will not be pushed to GitHub

Important:
- You do not need to write SQL manually in Supabase
- You do not need to create tables manually in Supabase
- Prisma migration will create the schema for you

## 1. What you need from Supabase

Create a Supabase project, then open:

`Project Settings` -> `Database` -> `Connect`

Copy these two connection strings:

1. `Transaction pooler`
   Use this for `DATABASE_URL`

2. `Direct connection`
   Use this for `DIRECT_URL`

For your project, the format is:

```env
DATABASE_URL="postgresql://postgres.upkpghiquhrcjsxrxcxr:YOUR_PASSWORD@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.upkpghiquhrcjsxrxcxr.supabase.co:5432/postgres"
```

## 2. Create local `.env`

In the project root, copy `.env.example` to `.env`:

```powershell
copy .env.example .env
```

Then fill it like this:

```env
DATABASE_URL="postgresql://postgres.upkpghiquhrcjsxrxcxr:YOUR_PASSWORD@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres:YOUR_PASSWORD@db.upkpghiquhrcjsxrxcxr.supabase.co:5432/postgres"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Notes:
- `.env` is ignored by Git
- do not commit `.env`
- only `.env.example` should be tracked

## 3. Generate Prisma client

Run:

```powershell
npm run db:generate
```

## 4. Apply the migration to Supabase

Because the Supabase database is still empty, just apply the committed migration:

```powershell
npm run db:migrate:deploy
```

This will create all required tables in Supabase.

You do not need:
- SQL Editor
- manual `CREATE TABLE`
- manual schema setup

## 5. Optional: seed initial data

If you want demo/admin data, run:

```powershell
npm run db:seed
```

This will create sample users such as:
- HR Admin
- sample New Hire

If this is a real production environment and you do not want demo users, skip this step.

## 6. Verify tables in Supabase

Open Supabase:

`Database` -> `Tables`

You should see these tables:

1. `User`
2. `Profile`
3. `ProbationTask`
4. `Presentation`
5. `Panelist`
6. `AuditLog`

If these tables exist, the database setup is correct.

## 7. Test locally before Vercel

Run:

```powershell
npm run dev
```

Then test:

1. Open `http://localhost:3000/login`
2. Sign in
3. Register a new user
4. Complete profile setup
5. Check that onboarding/probation tasks are created automatically
6. Check admin pages

## 8. Push code to GitHub

After local verification is done:

```powershell
git add -A
git commit -m "Prepare project for Supabase and Vercel deployment"
git push origin main
```

Safe note:
- `.env` will not be pushed because it is already ignored
- only source code, migration files, and `.env.example` will be pushed

## 9. Deploy to Vercel

In Vercel:

1. Import the GitHub repository
2. Select the project
3. Framework should be detected as `Next.js`
4. Keep the default build command, because this repo already has:

```json
"build": "prisma generate && next build"
```

## 10. Add Vercel environment variables

In Vercel Project Settings -> Environment Variables, add:

```env
DATABASE_URL=postgresql://postgres.upkpghiquhrcjsxrxcxr:YOUR_PASSWORD@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres:YOUR_PASSWORD@db.upkpghiquhrcjsxrxcxr.supabase.co:5432/postgres
NEXTAUTH_SECRET=your-long-random-secret
NEXTAUTH_URL=https://your-project-name.vercel.app
```

Recommended:
- add to `Production`
- add to `Preview` if you want preview deployments to work

## 11. Run production migration

Before first production use, make sure the production database has the committed migration applied.

Safest approach:
- run this locally against Supabase before relying on the Vercel app

```powershell
npm run db:migrate:deploy
```

If you later add new migrations, run the same command again before or during deployment.

## 12. Final production verification

After Vercel deploy succeeds:

1. Open the Vercel URL
2. Open `/login`
3. Test sign in
4. Test registration
5. Test profile setup
6. Test employee onboarding task creation
7. Test admin task management
8. Test presentation flow

## 13. Important production note about uploads

The application currently stores uploaded files in:

```text
public/uploads
```

This is okay for local development, but it is not ideal for long-term production use on Vercel because local filesystem storage is not durable like object storage.

For a stronger production setup, move uploads to:

1. Supabase Storage
2. Vercel Blob
3. AWS S3

For now:
- database deployment is ready
- application deployment is ready
- file uploads are the main remaining area to improve for full production durability

## 14. Exact command order

Use this exact order:

```powershell
copy .env.example .env
```

Fill `.env`, then run:

```powershell
npm run db:generate
npm run db:migrate:deploy
npm run dev
```

If local testing is good, then:

```powershell
git add -A
git commit -m "Prepare project for Supabase and Vercel deployment"
git push origin main
```

Then in Vercel:

1. import repo
2. add environment variables
3. deploy

## 15. Short version

For this repo, the correct deployment path is:

1. put Supabase URLs into `.env`
2. run `npm run db:generate`
3. run `npm run db:migrate:deploy`
4. test locally
5. push to GitHub
6. deploy on Vercel
7. add the same env values in Vercel

If you follow the steps above, you do not need to write SQL manually in Supabase.
