# Vision Menu — SaaS Restaurant Management System

(Formerly "OrderKaro" — the brand is **Vision Menu**. Internal package scope `@orderkaro/*`, localStorage keys `orderkaro-*`, and the `@@map("Canteen")` physical table are intentionally left unrenamed to avoid churn/data disruption; only user-visible brand is Vision Menu.)

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

- **Palette = "Bordeaux Noir"** (premium wine-crimson + champagne-gold on warm neutrals). All colors are CSS-variable tokens defined in `apps/web/src/app/globals.css` and exposed as Tailwind tokens in `tailwind.config.ts`. Use the tokens, never raw hex:
  - `brand-red` / `primary` = wine-crimson (light `#A31D33`, dark `#BE2540`), via `--brand-red`
  - `brand-gold` / `accent` = champagne gold (`#A9822B` / `#D9B24A`) — sparingly, 5–15% (price, active state, focus)
  - `canvas` (warm bg), `surface`/`surface-elevated` (cards), `ink` (text), `muted`, `line` (border)
  - semantic `success` / `warning` / `danger` — the OLD bright red now lives only in `danger`
  - the `neutral-*` scale is warmed (taupe, not cold gray)
- **Dark mode** is opt-in via `[data-theme="dark"]` / `.dark` (tokens flip). The existing web screens are still light-built; full dark-mode conversion is a follow-on — do not rely on `prefers-color-scheme` auto-flip.
- **Tenant branding exception:** on the CONSUMER storefront only, `StorefrontTheme` overrides `--brand-red` with the restaurant's `primaryColor` (paid feature). `DEFAULT_BRAND_COLOR` is now the wine `#A31D33` (`apps/web/src/lib/brand-color.ts`).
- Premium, expensive, minimal aesthetic — generous whitespace, editorial serif for hero/dish names, clean sans for UI, weighted cinematic motion
- Framer Motion animations on all interactions
- ZERO comments in ALL code files — no inline, no docstrings, no block comments
- Self-explanatory naming conventions only

## Database

- PostgreSQL on **Neon** (cloud) — connection string in `DATABASE_URL`
- Prisma schema at `apps/web/prisma/schema.prisma` (single source of truth)
- Run `pnpm --filter @orderkaro/web exec prisma db push` after schema changes
- Run `pnpm --filter @orderkaro/web exec prisma generate` to update the client
- The domain is a **Restaurant** everywhere in code, but the physical Postgres table is still `Canteen` and the FK columns are still `canteenId` — pinned via `@@map("Canteen")` / `@map("canteenId")`. This was deliberate: it renamed the code with zero data migration. Do not "fix" the maps unless you also rename the columns in the database.

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

- Wallet is **per-restaurant** (`Wallet` unique on `(consumerId, restaurantId)`): cash deposits credited by a manager, bank transfers need approval, and online top-up via the restaurant's own PayPur/Stripe. A balance is spendable only at the restaurant it was loaded at. Resolve wallets by `consumerId_restaurantId`, never `consumerId` alone; use `getOrCreateWallet()`
- Order fulfillment types: `DINE_IN` (table QR or picked table), `TAKEAWAY`, `DELIVERY` (with `deliveryLocation`); `Order.tableId` is nullable
- Prices snapshotted in OrderItem at placement time
- Sequential order numbers per restaurant per day
- Idempotency keys on order placement to prevent duplicates
- **No realtime server** — kitchen/counter refresh via TanStack Query polling. The socket client stays inert unless `NEXT_PUBLIC_SOCKET_URL` is set.

## SaaS Plans

- `FREE` / `BASIC` (₹499/mo) / `PRO` (₹1499/mo) — defined in `apps/web/src/lib/plans.ts`, the single source of truth for limits and features
- Gate server-side with `requireFeature(restaurant, "branding" | "delivery" | "viewAnalytics" | "ar")` and `requireWithinLimit(...)`; both throw **402**, which the UI turns into an upgrade prompt
- `effectivePlan()` treats a lapsed `planValidUntil` as FREE — always read the plan through it, never off `restaurant.plan` directly
- Billing is a 30-day period paid via Razorpay (`billing/checkout` → `billing/verify`). There are **no** auto-renewals and no Razorpay webhooks — a lapsed plan silently degrades to FREE limits
- AR needs PRO; branding, delivery zones and view analytics need BASIC

## Payments

- Gateway is picked from `Restaurant.country` in `apps/web/src/lib/payments/` — `IN` → **PayPur**, everything else → **Stripe**. Always go through the interface; never call a gateway directly
- **Bring-your-own-credentials for BOTH providers.** Each restaurant connects their own account (PayPur key+salt, or a Stripe secret key), so diners pay the restaurant directly and the platform never holds the money. Consequence: **no per-order commission anywhere** — platform revenue is subscriptions only. `commissionPercent` and the platform-fee plumbing exist but are inert (`supportsPlatformFee` is false on every adapter)
- PayPur quirks: no webhook or refund API; its status endpoint keys on `txn_id` (not `order_id`); the paid `amount` is a few paise above `base_amount` for reconciliation, so compare against `base_amount`
- Stripe here is plain Checkout Sessions on the restaurant's own secret key — **not Connect**. No onboarding, no application fee, no platform webhook. Confirmation uses the return redirect + reconciliation, same as PayPur
- Restaurant credentials are encrypted with `CREDENTIAL_ENCRYPTION_KEY` (AES-256-GCM) and are write-only from the UI. **The key must be identical in every environment** — local and production share one database, and rotating it orphans stored credentials
- Online orders are created `AWAITING_PAYMENT` and only become `PLACED` once payment is confirmed. Any new order-count or revenue query must exclude `AWAITING_PAYMENT`
- `reconcilePendingPayments()` polls the gateway status endpoint to catch payments where the diner closed the tab (neither provider uses a webhook now)
- **Two separate money flows.** Order payments (diner → restaurant) use each restaurant's OWN credentials from `RestaurantPaymentAccount`. SaaS subscription billing (restaurant → platform) uses the PLATFORM's own credentials from env — `PAYPUR_PLATFORM_KEY`/`PAYPUR_PLATFORM_SALT` (India) and `STRIPE_SECRET_KEY` (abroad) — via `lib/payments/platform.ts`. Razorpay now powers ONLY consumer wallet top-up
- Plan prices are INR and charged in INR through either gateway; subscription activation happens only after `confirmSubscriptionPayment` sees a paid status (billing-return route + polling)

## Delivery Zones

- The geo zone is **opt-in**: it is only enforced when `deliveryEnabled` is true AND the restaurant has `latitude`/`longitude`. Otherwise delivery falls back to the original free-text `deliveryLocation` with no fee, so existing restaurants keep working
- Distance is Haversine (`apps/web/src/lib/geo.ts`); the fee is added to `totalAmount` before the wallet is debited

## AR / 3D

- `MenuItem.model3dUrl` is a URL to a hosted `.glb`. There is **no upload path** — Cloudinary credentials are empty and Cloudinary does not host glb anyway
- The consumer viewer lazy-loads `@google/model-viewer` client-side only; the public menu strips model URLs when the plan lacks AR
