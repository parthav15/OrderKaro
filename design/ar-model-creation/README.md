# In-App 3D Model Creation for the AR Menu — Research & Architecture

**Status:** Research + concrete proposal. No code or DB changes. 2026-07-22.
**Goal:** Let a restaurant owner CREATE a 3D model of a dish from inside Vision Menu (snap a photo → get a `.glb`), so the AR menu populates itself instead of depending on the manual "request a 3D model" queue.

> This document is written to be dropped straight into the existing AR plumbing. It does not invent a green field — it extends what already ships.

---

## TL;DR (the recommendation)

- **Start with AI single-image → 3D, not photogrammetry.** A busy owner will take one photo, not a 40-photo turntable. Photogrammetry and on-device Object Capture are a later, iOS-only, higher-friction tier.
- **Primary provider: Meshy AI. Backup / A-B: Tripo AI (Tripo3D).** Both are REST, async (job-id + poll), return **GLB and USDZ directly** (so we skip server-side conversion), have explicit **commercial ownership on paid tiers**, and are the two most-cited image-to-3D APIs for exactly this "one photo of a product" use case. See tables below.
- **MVP flow:** owner taps "Generate 3D" on a menu item → uploads/snaps 1 photo → we call the provider → poll the job → **owner previews and approves** the result → we host the GLB/USDZ/poster and set `MenuItem.model3dUrl` (+ poster, + usdz). Reuse and extend the existing `ModelRequest` table for job tracking; keep the manual super-admin flow as the fallback for models the AI mangles.
- **Host on Cloudflare R2** (zero egress, public bucket + custom domain + CORS) — **not** Cloudinary (image-only in our code, and it does not process/serve `.glb` as a first-class 3D asset). Vercel Blob is the "already in the Vercel account" alternative but pays per-GB egress.
- **Cost one-liner:** at Meshy's Pro tier (~$20/mo, 1,000 credits, 30 credits per textured image-to-3D) a model costs **~$0.50–0.60**; folding that into the PRO plan as an *included monthly quota* (e.g. 30 generations/mo) plus optional top-up credits keeps AR a PRO differentiator without bleeding margin. Hosting a few thousand small glb/usdz files on R2 is single-digit dollars/month.
- **Be honest about quality:** food is one of the hardest subjects for AI 3D and photogrammetry alike (organic shapes, subsurface scattering, glossy/wet/translucent surfaces, drinks in glass). The preview/approve gate and the manual fallback are load-bearing, not optional polish.

---

## 1. How this fits the current Vision Menu stack

What already exists (verified in the codebase):

| Piece | File | Reality |
|---|---|---|
| AR viewer | `apps/web/src/components/consumer/menu/ar-viewer.tsx` | `@google/model-viewer`, `ar-modes="webxr scene-viewer quick-look"`, takes `modelUrl` + `posterUrl`. **Needs GLB** (model-viewer / Scene Viewer on Android / WebXR) and benefits from a real **USDZ** for iOS AR Quick Look. |
| Menu item fields | `apps/web/prisma/schema.prisma` (`MenuItem`) | `model3dUrl String?`, `model3dPosterUrl String?`. **No USDZ field yet.** |
| Set model on item | `apps/web/src/app/api/v1/restaurants/[id]/menu/items/[itemId]/model/route.ts` | `PUT` gated by `requireFeature(restaurant, "ar")`; writes `model3dUrl` + `model3dPosterUrl` (schema `menuItemModelSchema`). |
| Manual "request a 3D model" | `.../restaurants/[id]/model-requests/route.ts` + `.../admin/model-requests/[reqId]/route.ts` | `ModelRequest { status, notes, resultUrl }`, enum `PENDING / IN_PROGRESS / COMPLETED / REJECTED`. Super-admin completes a request by pasting a `resultUrl`, which is written into `MenuItem.model3dUrl` inside a transaction. **This is the async-job skeleton we extend.** |
| Image upload | `apps/web/src/app/api/v1/upload/route.ts` | Signed **Cloudinary `image/upload`** only. Confirms the point in CLAUDE.md: our upload path is images-only and Cloudinary is not a 3D host. |
| Plan gating | `apps/web/src/lib/plans.ts` | `FREE / BASIC / PRO`; **AR is PRO-only** (`features.ar`). `requireFeature` throws **402**. No per-generation quota concept exists yet — we add one. |
| Mobile app | `apps/mobile` | Expo ~54. **`expo-camera` ✓, `react-native-webview` ✓, `expo-image` ✓.** **`expo-image-picker` ✗ (not installed), no `expo-file-system`.** AR itself is shown via the web viewer (webview), not a native RN 3D renderer. |

What is missing (the gap this feature fills):

1. A way for the owner to **produce** a model (today the only producer is a human super-admin fulfilling a `ModelRequest`).
2. A **3D-capable host** (Cloudinary can't; nothing in the repo serves `.glb`/`.usdz`).
3. **USDZ** generation for iOS AR Quick Look (model-viewer can auto-generate one on the fly, but only in Safari and only "best-effort" — see §6).
4. **Async job orchestration** for generation that takes 30 s – several minutes.
5. **Cost/quota gating** so PRO's included AR doesn't turn into an unbounded API bill.

---

## 2. The landscape — two families

**Family 1 — AI generation (text→3D / image→3D).** A neural model hallucinates a full 3D mesh + PBR textures from one image (or a text prompt). Best fit for "owner snaps one photo." Turnaround tens of seconds to a few minutes. This is the MVP.

**Family 2 — Photogrammetry / scanning.** Reconstruct geometry from *many* real photos or a video orbit (classic multi-view stereo) or on-device (Apple Object Capture). Higher potential fidelity for rigid, matte objects, but high capture friction and weak on the shiny/wet/translucent surfaces that define food and drink. A later tier.

<!-- TABLE_A_PLACEHOLDER: AI generation comparison table filled from verified provider research -->

<!-- TABLE_B_PLACEHOLDER: Photogrammetry comparison table filled from verified provider research -->

<!-- FOOD_QUALITY_PLACEHOLDER: per-provider food verdict paragraph -->

---

## 3. Food is the hard part (honest quality caveats)

This is the section to read before promising anything to customers.

- **Food is widely considered one of the hardest 3D subjects.** Realism needs subsurface scattering (waxy/fleshy/liquid look), specular variation (wet/greasy highlights), and irregular organic geometry — exactly the things single-image AI 3D approximates rather than reproduces. Tripo's own food/beverage guide concedes the difficulty of "crusty bread, translucent onion layers, cappuccino foam" and leans heavily on prompt engineering, clean reference photos, three-point studio lighting, and hand-tuned materials to get good output. (Sources in §11.)
- **Independent testing** of the current image-to-3D models shows they are strong on rigid objects and at *inferring unseen angles*, but degrade on "complex organic forms" and drop fine detail — which is precisely the failure mode for a plated dish.
- **Reflective / transparent / liquid** items (a soda in a glass, a glossy curry, cellophane wrap) are the worst case for **both** AI 3D **and** photogrammetry. Photogrammetry literally needs matte, textured, opaque surfaces to find feature correspondences; glossy and see-through surfaces produce holes and blobs. Vendors selling reflective-product AR often push Gaussian-splatting capture instead of a clean mesh for these.
- **Consequence for the product:** treat AI output as a *draft that a human accepts or rejects*, never as auto-published. The preview/approve gate (§5) and the existing manual `ModelRequest` fallback are how we keep a bad melted-burger mesh off the live menu.

**Guidance we should surface in the capture UI:**
- One dish, centered, filling the frame; plain, uncluttered background (a clean plate on a solid-color surface).
- Soft, even, bright light; avoid harsh single-source glare and deep shadows.
- Shoot slightly above at ~30–45°, the natural "hero" food angle, so the top and near side are both visible.
- Avoid glassware/drinks and heavily sauced/greasy dishes in v1; flag them as "may need our design team" (route to the manual flow).

---

## 4. Recommended architecture — owner capture flow

Two capture modes; ship (a) first.

**(a) Single photo → AI 3D — the MVP (lowest friction).**
- **Web admin:** on the menu-item editor, an "Generate 3D model (AI)" button opens a dropzone / file input (reuse the existing image-upload UI pattern). Owner drops the dish photo they almost certainly already have.
- **Mobile (Expo):** `expo-camera` (already installed) to snap, **plus add `expo-image-picker`** (not yet installed) to choose an existing photo — most owners already have marketing photos. The captured/picked local URI is sent as `multipart/form-data` via `fetch` (RN supports file URIs in `FormData`; no `expo-file-system` needed for the upload itself).
- One photo, one tap. This is the whole point — it beats the manual queue by removing the human turnaround.

**(b) Multi-photo / video scan — later tier (higher fidelity, higher friction).**
- Web/mobile guided capture: 20–70 photos or a slow orbit video → cloud photogrammetry API (KIRI / Polycam) **or** on-device Apple Object Capture (iOS only, native module — see §7).
- Only worth it for hero dishes where AI quality isn't good enough and the owner will invest the effort.

**Recommendation:** MVP = (a) single photo via AI, on **web admin first** (owners set up menus on desktop), then mobile. Defer (b).

---

## 5. Recommended architecture — backend pipeline

Extend the existing `ModelRequest` machinery rather than inventing a parallel system. A generation *is* a model request whose fulfiller is an API instead of a human.

### Sequence

```mermaid
sequenceDiagram
    participant O as Owner (web/mobile)
    participant API as Next.js API (/api/v1)
    participant IMG as Image host (Cloudinary or R2)
    participant GEN as 3D provider (Meshy/Tripo)
    participant R2 as Model host (Cloudflare R2)
    participant DB as Postgres (Prisma)

    O->>API: POST generate (menuItemId, dish photo)
    API->>API: requireFeature(ar) + quota check (402 if over)
    API->>IMG: upload source photo -> imageUrl
    API->>GEN: create image-to-3D task(imageUrl)
    GEN-->>API: providerJobId (async)
    API->>DB: ModelRequest{ source:AI_IMAGE, status:IN_PROGRESS, providerJobId }
    API-->>O: 202 {requestId} (UI shows "Generating…")

    loop poll (cron / client TanStack Query) every ~10-15s
        API->>GEN: GET task(providerJobId)
        GEN-->>API: status + (glbUrl, usdzUrl, thumbnailUrl) when SUCCEEDED
    end

    API->>GEN: download glb (+ usdz, + poster)
    API->>R2: put glb / usdz / poster (public, CORS)
    API->>DB: ModelRequest.status = AWAITING_REVIEW, resultUrl/usdz/poster set
    API-->>O: notify "ready to preview"

    O->>API: preview in model-viewer, then APPROVE
    API->>DB: tx: MenuItem.model3dUrl/usdz/poster := result; ModelRequest.status = COMPLETED
    Note over O: (or REJECT -> falls back to manual request)
```

### Step list

1. **Gate + quota.** `requireFeature(restaurant, "ar")` (existing). Then a new `requireWithinLimit(..., "maxAiModelsPerMonth", used)` (new — see §8). Both throw 402 → existing upgrade-prompt UX.
2. **Store the source photo.** Reuse the Cloudinary image upload (it is fine for a 2D source image) or write it to R2. Get a public `imageUrl` the provider can fetch.
3. **Kick off the async job.** POST to the provider's image-to-3D endpoint with `imageUrl`; store the returned `providerJobId`. Request GLB **and** USDZ output where the provider supports it (Meshy/Tripo do) so we skip conversion.
4. **Track it in `ModelRequest`.** Set `status = IN_PROGRESS`, `source = AI_IMAGE`, `provider`, `providerJobId`. Return `202` immediately.
5. **Poll to completion.** Two options: (i) a Vercel Cron route that sweeps `IN_PROGRESS` requests every minute (fits our "no realtime server, polling only" rule from CLAUDE.md), and/or (ii) client-side TanStack Query polling the request status for live UI. Prefer server cron as the source of truth; client polling just reflects it. (Some providers offer webhooks; a webhook route is a nice-to-have but cron is enough and matches our architecture.)
6. **Ingest assets to our own host.** Provider asset URLs are temporary/expiring — download the GLB (+ USDZ + thumbnail) and re-upload to **R2** under a stable key (e.g. `models/{restaurantId}/{menuItemId}/{hash}.glb`). Never point `model3dUrl` at the provider's expiring URL.
7. **Poster.** If the provider returns a thumbnail, use it as `model3dPosterUrl`. Otherwise render one (server-side headless render, or a cheap "first frame" via the provider's preview image). A poster is what the consumer sees before tapping AR.
8. **USDZ.** Prefer the provider's USDZ. If a chosen provider ever returns GLB only, either (a) let model-viewer auto-generate USDZ (Safari-only, best-effort) for v1, or (b) run a **glb→usdz** conversion step (see §6).
9. **Preview + approve (critical).** Move to `status = AWAITING_REVIEW`. The owner opens the model in the same `model-viewer` the diner will see, and taps **Approve** (→ transaction writes `MenuItem.model3dUrl/usdz/poster`, `status = COMPLETED`) or **Reject** (→ `status = REJECTED`, offer "send to our design team" = the existing manual flow, or "try another photo").

### Hosting decision

| Option | Storage | Egress | 3D-serving fit | Verdict |
|---|---|---|---|---|
| **Cloudflare R2** | **$0.015 / GB-mo** | **$0 (free egress)** | Public buckets via `r2.dev` or custom domain, configurable CORS. GLB/USDZ are static files served repeatedly to diners → egress is the cost that matters. | **Recommended.** Zero egress is decisive for files fetched on every menu view. Free tier 10 GB + 1M Class-A + 10M Class-B ops/mo covers early usage. |
| **Vercel Blob** | $0.023 / GB-mo | **$0.05 / GB** data transfer | Public delivery + CDN, works with model-viewer. Pro includes 5 GB storage + 100 GB transfer. | Fine, and it's "in the Vercel account already," but you pay per-GB egress on every download. Use if you want one fewer vendor. |
| **Cloudinary** | (image plan) | — | Our route is `image/upload`; Cloudinary does not treat `.glb`/`.usdz` as first-class delivered 3D assets. Per CLAUDE.md: not a glb host. | **No.** Keep it for 2D images/posters only. |

GLB/USDZ files are small (typically ~0.5–5 MB each). A few thousand dishes is a few GB of storage and, because diners refetch them, **egress is the real cost** — which is exactly why R2's $0 egress wins. Model files must be served with permissive **CORS** (`Access-Control-Allow-Origin`) or `<model-viewer>` refuses to load them cross-origin; both R2 and Vercel Blob support this.

### Schema changes (proposal, do NOT apply here)

Extend, don't replace. `ModelRequest` already has `status/notes/resultUrl` and the right indexes.

```
// MenuItem: add one field
model3dUsdzUrl   String?   // iOS AR Quick Look; GLB stays the primary

// ModelRequest: add fields to track AI/photogrammetry jobs
source        ModelRequestSource  @default(MANUAL)   // MANUAL | AI_IMAGE | PHOTOGRAMMETRY
provider      String?                                // "meshy" | "tripo" | ...
providerJobId String?
inputImageUrl String?                                // (or String[] for multi-photo)
usdzUrl       String?
posterUrl     String?
errorMessage  String?

enum ModelRequestSource { MANUAL  AI_IMAGE  PHOTOGRAMMETRY }
// extend ModelRequestStatus with: AWAITING_REVIEW  (between IN_PROGRESS and COMPLETED)
```

`menuItemModelSchema` (shared) gains an optional `model3dUsdzUrl`. The existing `PUT .../model` route and the super-admin completion route keep working unchanged; the approve step reuses the same transaction pattern that already writes `resultUrl → MenuItem.model3dUrl`.

---

## 6. USDZ + conversion notes (iOS AR Quick Look)

- `model-viewer` **auto-generates a USDZ on the fly from the GLB** when you do *not* set `ios-src`. Caveats verified from the model-viewer project: it is **best-effort** (fails on some materials/animations) and works **only in Safari on iOS** — Chrome on iOS needs a real `ios-src` USDZ. So: fine as a v1 fallback, but shipping a real USDZ is more robust and covers Chrome iOS.
- **Best path: pick a provider that returns USDZ directly** (Meshy and Tripo do). Then there is no conversion step at all — we just host their `.usdz`.
- **If we ever need server-side glb→usdz:** Apple's Python `usdzconvert` / `usdpython` tools are **retired** (per the Alliance for OpenUSD forum), and Reality Converter is a macOS GUI. The practical serverless-friendly route is **Google's `usd_from_gltf`**, commonly run as a Docker image (e.g. community `marlon360/usd-from-gltf` / a `gltf-to-usdz-service` HTTP container). Blender can export USD via CLI but has known shader/occlusion gaps for USDZ. This would run as a separate worker/container, not inside a Vercel serverless function. **Avoid needing it by choosing a USDZ-returning provider.**

---

## 7. Photogrammetry / on-device (the later tier)

- **Apple Object Capture (RealityKit `PhotogrammetrySession`)** runs **on-device** (iPhone/iPad/Mac), outputs **USDZ** (and OBJ/USD), no per-model cloud cost, good for matte rigid objects. But: **iOS-only**, outputs USDZ (so we'd still need USDZ→GLB for web/Android), and in **Expo it requires a custom native Swift module via the Expo Modules API + a config plugin + an EAS/prebuild dev build** — it cannot run in Expo Go. High integration cost; justified only once AR is a proven revenue driver and we want a premium "scan it yourself" capture on iOS.
- **Cloud photogrammetry APIs (KIRI Engine, Polycam)** take a photo set or video and return GLB/USDZ/OBJ; async job + poll, per-scan/credit pricing. Lower integration cost than Object Capture (just HTTP), higher capture friction than single-photo AI. Good "family 2" option if AI fidelity proves insufficient. (Verified specifics in Table B.)
- **Photogrammetry for food specifically:** high friction (20–70 photos of a plate that a busy owner won't shoot) and weak on the shiny/wet/translucent surfaces food is full of. Not the MVP.

---

## 8. Plan gating & cost model

AR stays a **PRO** feature (unchanged). The new cost is *per generation* API spend, so we cap it.

**Recommended model: included monthly quota on PRO + optional paid top-ups.**
- Add `maxAiModelsPerMonth` to `PlanDefinition` in `plans.ts` (e.g. `FREE: 0`, `BASIC: 0`, `PRO: 30`). Enforce server-side with a `requireWithinLimit`-style check counting `ModelRequest` rows where `source != MANUAL` in the current billing period; throw **402** when exceeded (reuses the existing upgrade/limit UX).
- Optional: sell **top-up credit packs** (like wallet top-ups) for owners who want more than the included quota — maps cleanly onto per-model API cost.
- Alternative (lower ops burden, worse UX): **bring-your-own API key** — the owner pastes their own Meshy/Tripo key (encrypt with the existing `CREDENTIAL_ENCRYPTION_KEY` / `RestaurantPaymentAccount` pattern). Then the API cost is theirs, not ours. Good escape hatch for heavy users; bad default (friction, signup).

**Rough monthly cost math** (see §11 for verified pricing; refine from Table A):
- **Meshy Pro** ≈ $20/mo for 1,000 credits; a **textured image-to-3D = 30 credits** → ~33 models/mo → **~$0.60/model**. An included PRO quota of 30 models ≈ **$18/mo of API cost** per active AR restaurant — set the PRO price and quota so this stays a fraction of MRR.
- Providers with cheaper/free self-hostable models (e.g. open weights) can drive marginal cost toward zero later if volume justifies running our own inference — a phase-3 optimization, not MVP.
- **Hosting:** thousands of ~1–3 MB glb/usdz on **R2** = single-digit GB storage ($0.015/GB-mo) + **$0 egress** → effectively a few dollars/month at MVP scale.

---

## 9. Quality & UX guardrails (summary)

1. **Capture guidance** in the UI (the §3 checklist: one dish, plain background, even light, ~30–45° hero angle; discourage glass/drinks/heavily-sauced dishes in v1).
2. **Preview + approve gate** before anything publishes — owner sees the exact `model-viewer` the diner will see; Approve or Reject. Never auto-publish AI output.
3. **Fallback = the existing manual flow.** Reject → "send to our design team" opens a `ModelRequest` (manual) or "try another photo." The AI feature *augments* the human queue; it doesn't replace it.
4. **Retry cheaply.** Some providers give free retries on image-to-3D; expose "regenerate" so owners can iterate on angle/photo without burning quota where the provider allows it.
5. **Set expectations in copy.** "AI-generated preview — best for solid, plated dishes; drinks and glossy items may need a pro scan."

---

## 10. Phased build plan

**Phase 0 — Foundations (no user-facing change).**
- Stand up the **R2 bucket** (public, CORS, custom domain).
- Schema migration: `MenuItem.model3dUsdzUrl`; `ModelRequest.{source, provider, providerJobId, inputImageUrl, usdzUrl, posterUrl, errorMessage}`; `AWAITING_REVIEW` status; `ModelRequestSource` enum. (`prisma db push` + `generate` per CLAUDE.md.)
- `plans.ts`: add `maxAiModelsPerMonth` (PRO=30, others 0).

**Phase 1 — MVP: single-photo AI on web admin.**
- Integrate **Meshy** image-to-3D (async job + Vercel Cron poller). Ingest GLB/USDZ/poster to R2.
- Web admin: "Generate 3D (AI)" on the menu-item editor → upload photo → status → **preview + approve**.
- Quota gating (402 + upgrade prompt). Manual `ModelRequest` stays as fallback.

**Phase 2 — Mobile capture + quality.**
- Add `expo-image-picker`; wire `expo-camera` + picker → same generate endpoint in the Expo app.
- Add **Tripo** as a second provider behind a flag; A/B on food quality; pick per-dish or auto-fallback.
- Regenerate/retry UX; capture-guidance coaching screen.

**Phase 3 — iOS USDZ / on-device + optimization.**
- Ensure a real USDZ ships for every model (provider USDZ, else the Docker `usd_from_gltf` worker) so Chrome-iOS AR works, not just Safari.
- Optional **cloud photogrammetry** (KIRI/Polycam) tier for hero dishes.
- Optional **Apple Object Capture** native Expo module (config plugin + dev build) for a premium iOS "scan it" capture.
- Optional self-hosted open-weights inference if volume makes per-model API cost the bottleneck; optional BYO-API-key for heavy users.

---

## 11. Sources

Verified during this research (URLs):

- model-viewer automatic USDZ generation (Safari-only, best-effort): https://github.com/google/model-viewer/discussions/2975 ; https://github.com/google/model-viewer/discussions/2898
- Apple `usdzconvert` retired / glb→usdz via `usd_from_gltf` Docker: https://forum.aousd.org/t/obj-gltf-to-usdz-usdzconvert-discontinued/1648 ; https://github.com/marlon360/gltf-to-usdz-service ; https://github.com/leon/docker-gltf-to-udsz
- Vercel Blob pricing ($0.023/GB-mo storage, $0.05/GB transfer, ops rates): https://vercel.com/docs/vercel-blob/usage-and-pricing
- Cloudflare R2 pricing ($0.015/GB-mo, $0 egress, free tier, public buckets): https://developers.cloudflare.com/r2/pricing/
- Meshy pricing / credits / commercial license / USDZ output: https://www.meshy.ai/pricing ; https://www.meshy.ai/api ; https://www.meshy.ai/features/image-to-3d
- Tripo food & beverage guide (food difficulty + capture tips): https://www.tripo3d.ai/blog/explore/ai-3d-model-generator-for-food-and-beverage-3d-render-assets
- Independent Tripo image-to-3D quality review: https://www.whytryai.com/p/tripo-ai-hd-model
- Restaurant AR-menu prior art (Object Capture + AI single-photo): https://ar-code.com/blog/revolutionizing-restaurant-menus-with-ar-code-object-capture-3d-scanning-and-ar-qr-codes ; http://menuar.world/
- Expo native module + config plugin + prebuild (Object Capture integration cost): https://docs.expo.dev/modules/config-plugin-and-native-module-tutorial/ ; https://docs.expo.dev/config-plugins/plugins/

Provider-specific pricing/license/format/API sources are listed under each row in Tables A and B.
