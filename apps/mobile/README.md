# Vision Menu — Mobile (Expo)

Premium React Native app for the Vision Menu platform. Diners, restaurant owners, and
kitchen/counter staff, sharing the same backend as the web app (`apps/web`).

## Stack

- Expo SDK 53 (RN 0.79, React 19) · Expo Router (typed routes)
- NativeWind v4 + Reanimated 3 + Moti (heavy, cinematic motion)
- TanStack Query · Zustand · `expo-secure-store` (auth) · `expo-notifications` (push)
- "Bordeaux Noir" design system (`src/theme/tokens.js`), shared with web
- Playfair Display (serif) + Inter (sans) via `@expo-google-fonts`

## Run

```bash
cd apps/mobile
pnpm install                 # from repo root also works
npx expo install --fix       # reconcile every dep to the exact SDK 53 version
```

Then run it with ONE of these:

```bash
npx expo start   →  press i     # iOS Simulator (recommended; installs matching Expo Go SDK 53)
npx expo start   →  press a     # Android emulator / Android Expo Go
npx expo run:ios --device       # physical iPhone: builds a dev client (needs Xcode signing)
```

**Do not use Expo Go on a physical iPhone.** Expo Go for iOS only ships the *latest*
SDK (currently 54); this project is on SDK 53 (pinned there because Moti's animations
are broken on Reanimated 4 / SDK 54). A physical iPhone therefore needs a development
build (`expo run:ios --device` or an EAS dev build), which is the correct way to ship
this app anyway. The iOS **Simulator** has no such limitation — it installs the matching
SDK 53 Expo Go automatically, so it's the fastest way to see the app.

The API base URL comes from `EXPO_PUBLIC_API_URL` (see `.env.example`), defaulting to the
deployed backend. Copy it to `.env` to point at a local/staging API.

## Structure

```
app/                      Expo Router routes
  _layout.tsx             providers (theme, query, gesture, safe-area) + font gate
  index.tsx               role chooser (diner / owner / kitchen)
  (diner)/                diner app — identify -> discover (menu/AR/cart/pay land in Phase 2)
  (owner)/                owner console (Phase 3)
  (kitchen)/              kitchen & counter board (Phase 4)
src/
  theme/                  Bordeaux Noir tokens + ThemeProvider/useTheme
  lib/                    api client, secure-store auth (identify + silent re-identify), query client
  components/ui/          Screen, Text, Button, Card (Moti-animated component kit)
```

## Notes

- Consumer auth is phone + name -> `POST /api/v1/public/identify` (24h JWT, no refresh);
  on 401 the client silently re-identifies from the stored identity (mirrors web).
- Payments are native: PayPur `upi://` intents open GPay/PhonePe/Paytm via `Linking`;
  Stripe hosted checkout opens in a WebView. Both poll their status endpoint every 3s.
- App icon / splash images are not yet added (removed from `app.json` to keep dev builds
  clean) — add branded Vision Menu assets before an EAS build.
