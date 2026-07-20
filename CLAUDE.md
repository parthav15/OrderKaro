# OrderKaro — SaaS Canteen Management System

## Project Overview

QR-based ordering system: students scan a QR -> browse menu -> place order -> kitchen prepares -> pickup at counter (or takeaway / delivery).

Three interfaces in one Next.js app:
1. **Consumer PWA** (mobile-first) — `(consumer)/` route group
2. **Admin Panel** (desktop) — `(admin)/admin/` route group
3. **Kitchen + Counter Displays** (tablet) — `(kitchen)/kitchen/` and `(kitchen)/counter/`

## Tech Stack

- **Monorepo**: Turborepo + pnpm
- **Single app**: Next.js 14 (App Router) serves BOTH the UI and the API
- **Frontend**: Tailwind CSS, Zustand, TanStack Query, Framer Motion
- **Backend**: Next.js Route Handlers (`apps/web/src/app/api/v1/**`), Prisma ORM, PostgreSQL (Neon), JWT auth
- **Payments**: Razorpay (wallet top-up)
- **Shared**: Zod schemas + TypeScript types in `packages/shared/`

## Project Structure

```
apps/web/         → Next.js app — UI (all 3 interfaces) + API routes (src/app/api/v1/**)
packages/shared/  → Shared Zod schemas, types, constants
```

## Design Rules (STRICTLY ENFORCED)

- Colors: Red `#DC2626`, White `#FFFFFF`, Black `#0A0A0A` — NO other colors
- Premium, simple, sober aesthetic — generous whitespace, clean typography
- Framer Motion animations on all interactions
- ZERO comments in ALL code files — no inline, no docstrings, no block comments
- Self-explanatory naming conventions only

## Database

- PostgreSQL on **Neon** (cloud) — connection string in `DATABASE_URL`
- Prisma schema at `apps/web/prisma/schema.prisma` (single source of truth)
- Run `pnpm --filter @orderkaro/web exec prisma db push` after schema changes
- Run `pnpm --filter @orderkaro/web exec prisma generate` to update the client

## Running the Project

```bash
pnpm dev          # Next.js on http://localhost:3000 (UI + API together)
```

## API Structure

- Same-origin: `/api/v1/**` — keep `NEXT_PUBLIC_API_URL` empty so the client uses relative URLs
- Auth: JWT Bearer tokens in Authorization header
- Validation: Zod schemas from @orderkaro/shared
- Roles: OWNER, MANAGER, KITCHEN, COUNTER, CONSUMER

## Agent Team Roles

| Agent | Scope | Files |
|-------|-------|-------|
| frontend-developer | Next.js pages, React components, stores, hooks | `apps/web/src/**` (excluding `app/api`) |
| backend-developer | Next.js route handlers, auth, business logic | `apps/web/src/app/api/**`, `apps/web/src/lib/**` |
| database-specialist | Prisma schema, migrations, query optimization | `apps/web/prisma/**` |
| qa-specialist | Testing, validation, bug reporting | Read-only + Bash |
| security-reviewer | Security audits, auth review, vulnerability checks | Read-only + Bash |

## Key Patterns

- Wallet: cash deposits credited by a manager, bank transfers need approval, and **online top-up via Razorpay** directly from the cart
- Order fulfillment types: `DINE_IN` (table QR or picked table), `TAKEAWAY`, `DELIVERY` (with `deliveryLocation`); `Order.tableId` is nullable
- Prices snapshotted in OrderItem at placement time
- Sequential order numbers per canteen per day
- Idempotency keys on order placement to prevent duplicates
- **No realtime server** — kitchen/counter refresh via TanStack Query polling. The socket client stays inert unless `NEXT_PUBLIC_SOCKET_URL` is set.
