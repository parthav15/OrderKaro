# Vision Menu — AR / 3D Dish Models: Research (2026)

Two questions: (A) where to get ready-made `.glb` dish models, and (B) how to let
restaurants generate their own from inside the app. Context: RN/Expo SDK 54 app,
`MenuItem.model3dUrl` → hosted `.glb`, consumer viewer uses `@google/model-viewer`,
iOS AR Quick Look needs USDZ, Android uses Scene Viewer (GLB). No upload path yet.

## TL;DR

- **Build first:** in-app photo → cloud image-to-3D REST API → GLB. Default **Tripo3D**
  (~$0.20–0.30/model, GLB out, USDZ via one convert call). **Meshy** is the drop-in
  alternative (returns GLB **and** USDZ, no conversion infra; Pro $20/mo, ~$0.40–0.60/model).
- **Seed a free starter catalog** from CC0 stock: Meshy's CC0 food library (20k+, GLB+USDZ)
  and Poly Pizza (CC0 filter). ~$0 and safe to stream.
- **Two load-bearing gotchas** (below) decide the licensing and AR approach.

## Two critical gotchas

1. **Paid-marketplace licenses forbid streaming raw files.** AR ships the `.glb`/`.usdz` to
   the device (Android downloads it; iOS caches it and the user can even share it). Sketchfab
   Standard / CGTrader / TurboSquid all ban making the asset available "as a stand-alone file."
   → For a paid SaaS the defensible default is **CC0 or models we generate/own**; paid-marketplace
   models only behind auth + short-lived signed URLs, accepting gray area.
   (sketchfab.com/licenses, turbosquid royalty-free, cgtrader royalty-free)
2. **iOS AR Quick Look will NOT launch from inside a WebView** (WKWebView bug: `relList.supports("ar")`
   false-positives, then opens the USDZ as a raw zip). So `model-viewer`'s AR button is broken on iOS
   inside `react-native-webview`. → AR must go through a **native launcher**.
   (WebKit bug 239135, react-native-webview #1242)

## A. Ready-made `.glb` food models

Licensing classes: **CC0** = commercial OK, no attribution, redistribution OK (only fully safe
class for streaming). **CC-BY** = commercial OK but attribution owed (painful in-app). **CC-NC/-ND**
= unusable. **Royalty-free (paid)** = commercial OK but no standalone-file redistribution.
**Editorial** = never for a commercial product.

| Source | Coverage / realism | License reality (paid SaaS) | Cost |
|---|---|---|---|
| Poly Pizza | ~10.6k models, decent food, low-poly/stylized | per-model CC0 or CC-BY (filter to CC0); has API | Free |
| Meshy CC0 library | 20k+ food/drink, GLB **and** USDZ | library models CC0; generated free-tier = CC-BY | Free |
| Kenney / Quaternius | limited, very stylized | CC0 | Free |
| Sketchfab | huge, best realism, GLB/USDZ | mixed CC (filter); paid Standard = standalone-file ban; Editorial = no commercial | Free–$5–50 |
| CGTrader / TurboSquid | best photoreal hero dishes; often FBX/OBJ → convert | royalty-free, but no standalone-file redistribution | ~$5–40/model |
| Fab (Epic) | growing food props, glTF+USDZ | CC (free) or Standard (paid) | Free–paid |
| iMeshh | photoreal, Blender + glTF | royalty-free commercial | Subscription |

**Verdict:** no single free CC0 library has photoreal coverage. CC0 = stylized (Poly Pizza/Kenney)
or hit-or-miss AI (Meshy library). Photoreal = paid per-dish (license-gated) or **AI-generate-and-own**.

## B. In-app 3D generation

### Photogrammetry (capture a real dish)
- **Apple Object Capture (on-device):** best matte-dish fidelity, $0/model, outputs USDZ. But requires
  **LiDAR + A14+ on iOS 17+ (iPhone 12 Pro and later Pro only)**; crashes on capture on unsupported
  devices. Needs a native Swift/RealityKit Expo module (high effort). `PhotogrammetrySession` also runs
  on **macOS** with photos from any phone (no LiDAR) → a Mac render node option. (Apple RealityKit docs, WWDC23)
- **KIRI Engine** — the only embeddable photogrammetry **API** ($1/scan, 500-credit/$500 min, 10 free,
  still "in testing"). Multi-photo friction per dish.
- **Polycam / Luma / RealityScan / Scaniverse** — no embeddable REST API/SDK. Not viable for an automated flow.

### AI image/text → 3D (ranked for "one photo of a plated dish")
- **Tripo3D — top value.** Async REST, image-to-3D, PBR. **100 credits = $1; image-to-3D = 20cr ($0.20)
  untextured / 30cr ($0.30) textured**, pay-as-you-go + free monthly credits. Returns **GLB**; convert
  endpoint → **USDZ/FBX/OBJ/STL/glTF**. Community rates it top for shape accuracy; markets food explicitly.
  (developers.tripo3d.ai/pricing)
- **Meshy — zero-conversion pick.** REST API on **Pro ($20/mo = 1,000cr, $0.02/cr)**. Image-to-3D (Meshy 6)
  = 20cr ($0.40) / 30cr ($0.60) textured. **Every task returns GLB + USDZ + FBX + OBJ + STL** (no conversion).
  Caveat: **download links expire in 3 days** → fetch + re-host immediately. Free tier has no API + CC-BY.
  (meshy.ai/pricing, docs.meshy.ai export-formats)
- **Rodin / Hyper3D — quality upgrade.** REST, **GLB-only** (needs USDZ conversion), polycount control,
  fast. ~$0.40/gen (via fal); direct $30/$120 mo. Community-best raw shape accuracy.
- **Stability SF3D / SPAR3D — cost floor.** API: Stable Fast 3D = **$0.02**; **open weights** (self-host,
  commercial <$1M rev). Modest quality. (platform.stability.ai/pricing)
- **Ruled out:** CSM/Cube (shutdown Jan 5 2026), Kaedim (enterprise + human-in-the-loop, $29→$7,700/mo),
  Meta 3DGen (research-only, no API), Sloyd + Luma Genie (not photo-of-real-dish), Alpha3D (self-serve
  but USDZ export + pricing unverified).

### Food is genuinely hard for single-photo AI
~80–90% accurate; error concentrates on **surfaces the camera never saw (hallucinated backs)**; glossy
sauces / drinks / glassware / translucency produce holes and spikes. **Mitigate with multi-view (2–4 angles),
matte lighting, and a mandatory human "approve before publish" step.**

## C. RN/Expo AR render + GLB→USDZ pipeline

- **In-app preview:** `react-native-filament` (native Filament, Metal/Vulkan, maintained by Margelo; Expo
  config-plugin + dev-client, not Expo Go). Avoid `expo-gl`+three/r3f (fragile + OpenGL-ES deprecation).
- **AR launch:** native — **`react-native-ar-viewer`** (ARKit iOS / ARCore Android; takes USDZ on iOS, GLB
  on Android). **Not** `model-viewer`'s AR button in a WebView on iOS. `model-viewer` with `src`(GLB)+`ios-src`(USDZ)
  is fine on the **consumer PWA/web**, just not inside the RN WebView for iOS AR.
- **GLB→USDZ (server-side at ingest):** Apple `usdzconvert` was retired (~2024); Reality Converter is Mac-GUI only.
  Best server options: **Blender headless** (`blender -b --python`, native USD export, best fidelity) or Google
  `usd_from_gltf` in Docker (purpose-built but unmaintained). Optimize first with `gltf-transform optimize`
  (draco + webp + resize). **Store both `.glb` (Android/web) + `.usdz` (iOS)**; serve USDZ as `model/vnd.usdz+zip`.
- **Android Scene Viewer:** GLB at a public HTTPS URL via intent; one animation per file; keep files small.

## Recommended architecture + phasing

Pipeline (this IS the missing upload path):
1. Capture in-app with `react-native-vision-camera` (1 photo, ideally 2–4 angles).
2. Upload image (presigned URL) → backend `api/v1/**` calls Tripo/Meshy **async REST**, **polls** (fits the
   existing no-realtime/polling pattern) → receives GLB.
3. GLB→USDZ (Meshy returns it; else Tripo convert endpoint or self-hosted converter).
4. Store `MenuItem.model3dUrl` (GLB) + new `usdzUrl`; re-host immediately (Meshy 3-day expiry).
5. Mandatory **preview + approve** before it goes live. Gate behind PRO (`requireFeature(..., "ar")`).
6. Display: consumer PWA `model-viewer` (src+ios-src) → Quick Look/Scene Viewer; RN admin preview via filament.

Phases:
- **P1 (days):** Tripo (or Meshy) single-photo generation + approve step + PRO gate. Seed CC0 starter catalog.
- **P2:** multi-view capture UI (biggest food-quality win); Rodin "HD" toggle for hero dishes.
- **P3:** optional on-device Object Capture "Pro Capture" for Pro-iPhone restaurants.

Cost: **~$0** for a CC0 + free-OSS MVP; **~$20–30 to generate a 100-dish menu**; ~$5–40 per hand-bought
premium hero dish. Tooling (filament, ar-viewer, gltf-transform, Blender) is free/MIT — pay only conversion compute.
