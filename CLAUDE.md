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
- **Payments**: PayPur (India) / Stripe (abroad), per-restaurant bring-your-own-credentials — pay-per-order only (no wallet)
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

- **No wallet / no stored value** (removed 2026-07-25). Diners pay per order: `PaymentMethod` is `CASH` or `ONLINE` only. A platform-held prepaid balance would be an RBI Prepaid Payment Instrument (licensed), so there is none. Online refunds go back to the gateway (Cashfree reversal — P3/manual for now); cash "change" is handed back at the counter, never stored
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
- **Online refunds are NOT automated yet.** Since online is now the main digital payment (no wallet), automatic online refunds (Cashfree reversal) are still the pending marketplace P3 piece — a cancelled online order can't auto-refund to UPI yet, so **handle those manually for now**. Cash is fully fine (nothing to refund; change is handed back at the counter)
- **Two separate money flows.** Order payments (diner → restaurant) use each restaurant's OWN credentials from `RestaurantPaymentAccount`. SaaS subscription billing (restaurant → platform) uses the PLATFORM's own credentials from env — `PAYPUR_PLATFORM_KEY`/`PAYPUR_PLATFORM_SALT` (India) and `STRIPE_SECRET_KEY` (abroad) — via `lib/payments/platform.ts`. Razorpay is now unused for live flows (the consumer wallet top-up it powered was removed 2026-07-25)
- Plan prices are INR and charged in INR through either gateway; subscription activation happens only after `confirmSubscriptionPayment` sees a paid status (billing-return route + polling)

## Marketplace / Split Settlement (customers pay the platform — IN PROGRESS)

The payment model is moving from **BYO-direct** (diners pay each restaurant's own gateway; platform never touches the money; no per-order margin possible) to a **marketplace**: **diners pay Vision Menu, and the platform settles each restaurant's share automatically**, keeping the delivery + convenience fee as its margin. Product decision: **India-first, migrate everyone.** All of this is **additive and inert** — the live BYO path is untouched until a restaurant is explicitly flipped.

- **Gate = `RestaurantPaymentAccount.collectionMode`**: `BYO` (default, legacy, unchanged) vs `MARKETPLACE` (platform collects + splits). Nothing marketplace runs unless a restaurant is `MARKETPLACE` **and** the platform rail for its country is configured. **Never flip a restaurant to `MARKETPLACE` in prod until that rail is sandbox-tested.**
- **Two settlement rails, chosen by `Restaurant.country`:**
  - **India → Cashfree Easy Split — DEFERRED / BLOCKED.** Prereqs on the platform's Cashfree account: (1) **KYC complete**, (2) **Easy Split feature activated** (must be requested from Cashfree; OFF by default), (3) `CASHFREE_PLATFORM_APP_ID` / `CASHFREE_PLATFORM_SECRET`. Test keys are already in `.env`, but Easy Split is **not activated**, so `createCashfreeVendor` 4xxs — this is the blocker, not the code. Restaurants onboard as **vendors** (`cashfreeVendorId`, `vendorKycStatus`, payout PAN/bank/UPI encrypted via `secure-store`); split via `order_splits` on the platform-collected order (restaurant keeps subtotal, platform keeps fees). No webhook/refund API (poll `fetchStatus`, reconcile).
  - **Abroad → Stripe Connect — being built now, testable immediately in Stripe TEST mode** (no KYC/activation gate; `STRIPE_SECRET_KEY`/`STRIPE_PUBLISHABLE_KEY`/`STRIPE_WEBHOOK_SECRET` test keys in `.env`). Restaurants = **Express connected accounts** (`stripeAccountId`; live status from Stripe's `account`: `stripeChargesEnabled`/`stripePayoutsEnabled`/`stripeDetailsSubmitted`), onboarded via **Stripe-hosted account links** — Stripe collects the bank/KYC, we store **none** of it. Checkout = **destination charge**: a platform Checkout Session with `payment_intent_data[application_fee_amount]` (= our fee) + `payment_intent_data[transfer_data][destination]` (= the restaurant's account). Platform keeps the application fee; the balance transfers to the restaurant. Refunds supported; confirm via webhook (`account.updated`, `checkout.session.completed`) + the same reconciliation as BYO.
- **Hidden fees (delivery + convenience) are a per-restaurant, configurable feature — NOT a fixed platform skim.** `RestaurantFeeConfig` (1:1 per restaurant): `deliveryFee` + `convenienceFee`, each `{ enabled, FLAT|PERCENT, amount, beneficiary }`. **Delivery-only.** **The owner sets the amounts** (`/api/v1/restaurants/[id]/fee-config`); **the super-admin sets each fee's `beneficiary`** per restaurant (`FeeBeneficiary RESTAURANT|PLATFORM`, default `RESTAURANT`; `/api/v1/admin/restaurant-fees` + `/[restaurantId]`). An owner never routes money to the platform — that lever is the platform operator's. `computeOrderFees(restaurantId, subtotal, orderType)` in `lib/order-fees.ts` returns the fees + a `restaurantShare`/`platformShare` split by beneficiary. **Not itemized to the diner** — bundled into a single "Delivery & handling" line. `platformShare` → the Stripe `application_fee_amount`; `restaurantShare` → the destination transfer. **A platform-beneficiary fee is only actually captured on a MARKETPLACE online order** — BYO/cash can't split, so the fee just stays with the restaurant. **Fees default OFF**, so no order total changes until an owner enables them. (The older global `PlatformConfig` singleton / `computePlatformFees` / `/admin/super/fees` panel are superseded by this per-restaurant model.)
- **Settlement fields on `Order`** (nullable/additive): `subtotal`, `convenienceFee`, `restaurantSettlementAmount`, `settlementStatus` (`PENDING`/`SETTLED`/`FAILED`/`REVERSED`). Plus the pre-existing inert `Order.platformFee` and `Restaurant.commissionPercent`.
- **Status:**
  - ✅ **Phase 1 (built, deployed, inert):** schema; `lib/platform-fees.ts`; super-admin fee config API + panel; Cashfree `createCashfreeVendor` (`lib/payments/cashfree-vendor.ts`); owner payout-onboarding API (`api/v1/restaurants/[id]/marketplace-onboarding`) + UI (web `components/admin/marketplace-onboarding-card.tsx`, mobile `src/components/payout-onboarding.tsx`).
  - ⏳ **Pending:** Stripe Connect adapter + onboarding + destination-charge checkout (Stripe first, since it's unblocked); the **order-flow flip** (apply fees on DELIVERY → collect on the platform → split → persist settlement fields; diner sees the bundled line, owner sees revenue vs platform fee); settlement tracking, refund/cancel **reversals**, a super-admin **margin dashboard**, and **migrating** existing restaurants. Cashfree Easy Split checkout resumes once the account is unblocked.

## Delivery Zones

- The geo zone is **opt-in**: it is only enforced when `deliveryEnabled` is true AND the restaurant has `latitude`/`longitude`. Otherwise delivery falls back to the original free-text `deliveryLocation` with no fee, so existing restaurants keep working
- Distance is Haversine (`apps/web/src/lib/geo.ts`); the fee is added to `totalAmount` before payment

## AR / 3D

- `MenuItem.model3dUrl` is a URL to a hosted `.glb`. There is **no upload path** — Cloudinary credentials are empty and Cloudinary does not host glb anyway
- The consumer viewer lazy-loads `@google/model-viewer` client-side only; the public menu strips model URLs when the plan lacks AR
- **Research (2026) lives in `docs/ar-3d-research.md`** (sources, in-app generation, pipeline — all primary-sourced). Key conclusions below.
- **iOS AR is broken inside the RN WebView.** `@google/model-viewer`'s AR button relies on Safari's `rel="ar"` → AR Quick Look handoff, which **WKWebView does not support** (WebKit bug 239135) — it opens the USDZ as a raw zip. Android's Scene Viewer intent also often won't fire from a WebView. So AR must be **launched natively from RN**, not from model-viewer's button in `react-native-webview` (`apps/mobile/src/components/ar-viewer.tsx`). model-viewer is fine for the on-device 3D spin *preview* and for AR on the actual web PWA.
- **iOS AR Quick Look requires a USDZ** (Apple won't take GLB). Store BOTH per dish: optimized `.glb` (Android Scene Viewer / web) + `.usdz` (iOS). Convert **server-side at ingest** — Apple `usdzconvert` was retired; use **Blender headless** (`blender -b --python`, native USD export) after `gltf-transform optimize`. (In-app GLB-only AR renderers like ViroReact avoid USDZ but are a heavier native path.)
- **Ready-made models: use CC0 or models we own.** AR streams the raw file to the device, and every *paid* marketplace license (Sketchfab/CGTrader/TurboSquid) forbids making it available "standalone." Seed from Meshy's CC0 food library (20k+, GLB+USDZ) + Poly Pizza (CC0 filter).
- **Letting restaurants make their own dish models = a cloud single-photo image-to-3D API** (this becomes the missing upload path). Default **Tripo3D** (~$0.20–0.30/model, GLB + USDZ convert endpoint); **Meshy** the drop-in alt (returns GLB+USDZ, no conversion infra, Pro $20/mo, links expire 3 days). Flow: `vision-camera` capture → backend calls the API async and **polls** → GLB → USDZ → store `model3dUrl`+`usdzUrl`; gate behind PRO (`requireFeature("ar")`); add multi-view capture + a human approve-before-publish step (single-photo food AI hallucinates hidden surfaces). Ruled out: CSM (shut down Jan 2026), Kaedim (enterprise/HITL), Apple Object Capture (Pro-iPhone-only, native — later "Pro Capture" phase).
