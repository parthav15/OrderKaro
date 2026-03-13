# OrderKaro — SaaS Canteen Management System

## Project Overview

QR-based ordering system: students scan table QR -> browse menu -> place order -> kitchen receives in real-time -> food prepared -> pickup at counter.

Three interfaces in one Next.js app:
1. **Consumer PWA** (mobile-first) — `(consumer)/` route group
2. **Admin Panel** (desktop) — `(admin)/admin/` route group
3. **Kitchen Display** (tablet) — `(kitchen)/kitchen/` route group

## Tech Stack

- **Monorepo**: Turborepo + pnpm
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Zustand, TanStack Query, Framer Motion
- **Backend**: Express.js, Prisma ORM, PostgreSQL, Socket.IO, JWT auth
- **Shared**: Zod schemas + TypeScript types in `packages/shared/`

## Project Structure

```
apps/web/         → Next.js frontend (all 3 interfaces)
apps/api/         → Express.js backend
packages/shared/  → Shared Zod schemas, types, constants
```

## Design Rules (STRICTLY ENFORCED)

- Colors: Red `#DC2626`, White `#FFFFFF`, Black `#0A0A0A` — NO other colors
- Premium, simple, sober aesthetic — generous whitespace, clean typography
- Framer Motion animations on all interactions
- ZERO comments in ALL code files — no inline, no docstrings, no block comments
- Self-explanatory naming conventions only

## Database

- PostgreSQL 17 at `localhost:5432`, database `orderkaro`, user `postgres`, password `123`
- Prisma schema at `apps/api/prisma/schema.prisma`
- Run `npx prisma db push` after schema changes
- Run `npx prisma generate` to update client

## Running the Project

```bash
pnpm dev          # Start both API (5000) and frontend (3000)
```

## API Structure

- Base URL: `http://localhost:5000/api/v1/`
- Auth: JWT Bearer tokens in Authorization header
- Validation: Zod schemas from @orderkaro/shared
- Roles: OWNER, MANAGER, KITCHEN, COUNTER, CONSUMER

## Agent Team Roles

| Agent | Scope | Files |
|-------|-------|-------|
| frontend-developer | Next.js pages, React components, stores, hooks | `apps/web/src/**` |
| backend-developer | Express routes, controllers, middleware, Socket.IO | `apps/api/src/**` |
| database-specialist | Prisma schema, migrations, query optimization | `apps/api/prisma/**` |
| qa-specialist | Testing, validation, bug reporting | Read-only + Bash |
| security-reviewer | Security audits, auth review, vulnerability checks | Read-only + Bash |

## Key Patterns

- Wallet system (no payment gateway) — cash deposits credited by manager, bank transfers need approval
- Prices snapshotted in OrderItem at placement time
- Sequential order numbers per canteen per day
- Socket.IO rooms: `canteen:{id}:kitchen`, `canteen:{id}:counter`, `order:{orderId}`
- Idempotency keys on order placement to prevent duplicates
