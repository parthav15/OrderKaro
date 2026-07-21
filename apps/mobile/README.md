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
npx expo start               # then press i / a, or scan the QR with Expo Go
```

`npx expo install --fix` is important: the versions in `package.json` are pinned to
SDK 53 but `--fix` guarantees the exact patch versions Expo expects.

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
