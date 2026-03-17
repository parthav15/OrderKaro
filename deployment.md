# OrderKaro — Deployment Guide

## Architecture

Everything runs as a single Next.js app on Vercel. The Express.js backend was converted to Next.js API Route Handlers (`apps/web/src/app/api/`), so there's no separate backend server. The database is Neon PostgreSQL (serverless).

## Stack

- **Hosting:** Vercel (Hobby plan)
- **Database:** Neon PostgreSQL
- **ORM:** Prisma (generated during build via `postinstall` script)
- **Monorepo:** Turborepo + pnpm

## Live URLs

| What | URL |
|------|-----|
| Production | https://order-karo-frontend.vercel.app |
| Admin Panel | https://order-karo-frontend.vercel.app/admin |
| Consumer Menu | https://order-karo-frontend.vercel.app/sachis-kitchen/menu |
| Kitchen Display | https://order-karo-frontend.vercel.app/kitchen |

## Environment Variables (set on Vercel)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `SUPER_ADMIN_EMAIL` | Owner email for admin access |
| `NEXT_PUBLIC_APP_URL` | Production URL of the app |

## Vercel Project Settings

- **Project name:** `web`
- **Framework:** Next.js
- **Root Directory:** `apps/web`
- **Install Command:** `cd ../.. && pnpm install`
- **Build Command:** `prisma generate && next build`
- **Deployment Protection:** Disabled (SSO + Vercel Auth both set to `none`)

## How It Was Deployed

### 1. Neon Database Setup

The Neon PostgreSQL database was provisioned externally. Schema was pushed using:

```bash
cd apps/web
npx prisma@6.4.0 db push
```

The database was seeded with initial data (owner account, canteen, categories, menu items, tables) using:

```bash
cd apps/web
npx tsx prisma/seed.ts
```

### 2. Vercel Project Creation & Configuration

The project was created and configured via Vercel CLI + API:

```bash
# Link the monorepo root to a Vercel project
cd CANTEEN_MANAGEMENT
npx vercel link --project web --yes

# Deploy to production
npx vercel deploy --prod --yes
```

Project settings (root directory, install/build commands) were set via the Vercel REST API:

```bash
curl -X PATCH -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/$PROJECT_ID" \
  -d '{
    "rootDirectory": "apps/web",
    "installCommand": "cd ../.. && pnpm install",
    "buildCommand": "prisma generate && next build"
  }'
```

Environment variables were added via:

```bash
curl -X POST -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v10/projects/$PROJECT_ID/env" \
  -d '{
    "key": "DATABASE_URL",
    "value": "...",
    "type": "encrypted",
    "target": ["production", "preview", "development"]
  }'
```

### 3. Disabling Deployment Protection

Vercel enables SSO protection by default. It was disabled via API so the app is publicly accessible:

```bash
curl -X PATCH -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/$PROJECT_ID" \
  -d '{
    "ssoProtection": {"deploymentType": "none"},
    "vercelAuthentication": {"deploymentType": "none"}
  }'
```

A redeploy is required after changing protection settings.

## Redeploying

```bash
cd CANTEEN_MANAGEMENT
npx vercel deploy --prod --token $VERCEL_TOKEN --yes
```

Or push to a connected GitHub repo — Vercel auto-deploys on push to `main`.

## Key Files

| File | Purpose |
|------|---------|
| `apps/web/vercel.json` | Vercel framework config |
| `apps/web/prisma/schema.prisma` | Database schema |
| `apps/web/prisma/seed.ts` | Seed script for initial data |
| `apps/web/src/lib/prisma.ts` | Prisma client singleton |
| `apps/web/src/lib/api-utils.ts` | Auth, response helpers for API routes |
| `apps/web/src/app/api/v1/**` | All API route handlers |

## Default Credentials

- **Owner:** `sachidanandsabrwal@gmail.com` / `password123`
