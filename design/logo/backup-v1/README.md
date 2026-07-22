# Vision Menu — Logo System

A **VM monogram** built in the monoline-geometric grammar of the RemCall
"RC-CUT" mark (`REMLY-AI/mobile/assets/source/rc-mark.svg`), re-cut from **RC → VM**
and recoloured from RemCall's ivory/ink duotone into Vision Menu's **Bordeaux Noir**
palette. Open `index.html` in a browser to review the whole set on dark and light
surfaces at multiple sizes.

---

## How we got here

The first pass explored original directions for the name (Vision + Menu):

1. **Aperture Plate** — a camera-iris/eye fused with a round plate, gold focal pupil.
2. **VM serif ligature** — an editorial Playfair-style interlock.
3. **Viewfinder / scan frame** — QR finder-corners framing a plate.
4. **Serif V + focus dot** — a single editorial V with a gold "sightline".

You then directed a simpler, decisive path: **use the logo we already ship on
RemCall, just change the theme colour, and make it VM instead of RC.** So the
delivered system is exactly that — same construction, Vision Menu colour, VM letters.

## The mark — construction

Taken verbatim from the RC-CUT method, so it stays consistent with the RemCall
system you already trust:

- **One stroke weight.** `stroke-width="17.5"` in a coordinate space with cap lines
  at `y = 15 → 113`. No gradients, no bevels, no second weight.
- **Flat, butt terminals; miter joins.** `stroke-linecap="butt"`,
  `stroke-linejoin="miter"`.
- **Circle-and-straight / letter-built.** The **V** is two diagonals to a sharp
  mitred point (`M 12 15 L 52 95 L 92 15`). The **M** is two vertical stems plus a
  central V that springs from inside the stems — the same "spring from the junction"
  move RemCall uses for the R's leg, so no acute apex spikes.
- **Font-independent.** The mark is pure geometry; it needs no font to render and is
  identical everywhere.

**Scaling.** Verified crisp from ~24px to 1024px. Below ~20px the two letters start
to close up (same limit RemCall hit — their 16px favicon drops to a single "R"). If
you want a true 16px favicon, use a single **V** on the wine tile; `favicon.svg` here
keeps the full VM and reads down to ~20px.

**Monochrome.** Because it is one stroke weight with counters formed by real gaps,
it collapses cleanly to a single ink (`monochrome.svg`) for stamping / embossing /
one-colour print.

## Colour — Bordeaux Noir, mapped from RemCall

RemCall ships a duotone (ivory `#F6F4EF` / ink `#0B0B0D`) plus a gold variant. The
recolour maps straight across, using only the Bordeaux Noir token hexes
(`apps/mobile/src/theme/tokens.js`):

| Role | RemCall | Vision Menu |
|------|---------|-------------|
| Primary mark (on light) | ink `#0B0B0D` | **wine `#A31D33`** |
| Reverse mark (on dark) | ivory `#F6F4EF` | **off-white `#FFF7F3`** |
| Accent / premium | gold `#C6A868` | **champagne `#A9822B` / `#D9B24A`** |
| Icon tile | ink tile | **wine tile** (radial `#A31D33 → #8E1A2D`) |
| Emboss / one-ink | ink | **ink `#1A1512`** |

**Gold discipline (5–15%).** Gold never carries the primary mark. It appears only as
(a) the two-tone "premium" cut — off-white/wine **V** + gold **M** — and (b) the thin
keyline on the app icon. Everything else is wine, off-white, or ink.

## Files

| File | What it is |
|------|------------|
| `mark.svg` | **Primary mark** — VM in wine `#A31D33`, transparent. |
| `mark-alt-1.svg` | Reverse — VM in off-white `#FFF7F3` for dark surfaces. |
| `mark-alt-2.svg` | Premium two-tone — wine V + gold M. |
| `monochrome.svg` | Single-ink VM `#1A1512` for stamp / emboss. |
| `lockup.svg` | Mark + "Vision Menu" wordmark, transparent (light use). |
| `lockup-light.svg` | Lockup on canvas `#F6F1EA`. |
| `lockup-dark.svg` | Lockup on near-black `#141110` (wine dark + gold). |
| `app-icon.svg` | 1024 iOS tile — wine gradient, off-white VM, gold keyline, safe margins. |
| `favicon.svg` | 128-grid wine tile + off-white VM (browser tab / PWA). |
| `index.html` | Self-contained review gallery (all SVGs inline). |

## Wordmark note

The lockup sets **"Vision Menu" in Inter Bold** (Vision Menu's companion grotesque),
to mirror RemCall's grotesque lockup as you asked. Vision Menu's house style
elsewhere leans editorial serif (Playfair) — if you'd prefer the wordmark in serif,
it's a one-line `font-family` swap on the three `lockup*.svg` files. Either way,
**outline the text to `<path>` before shipping** so it doesn't depend on the font
being installed (the marks themselves are already outline-independent).

## Exporting to PNG

This repo has **no rasteriser configured**, so PNG export is a follow-up step. The
SVGs are clean vector and will rasterise sharply with any of:

```bash
# librsvg (brew install librsvg)
rsvg-convert -w 1024 -h 1024 app-icon.svg -o app-icon-1024.png
rsvg-convert -w 32 -h 32 favicon.svg -o favicon-32.png
rsvg-convert -w 16 -h 16 favicon.svg -o favicon-16.png

# resvg  (cargo install resvg  /  npx @resvg/resvg-js-cli)
resvg --width 1024 app-icon.svg app-icon-1024.png

# sharp  (npx sharp-cli)
npx sharp -i app-icon.svg -o app-icon-1024.png resize 1024 1024

# Inkscape
inkscape app-icon.svg --export-filename=app-icon-1024.png -w 1024 -h 1024
```

Typical outputs: app icon `1024`; favicon `16 / 32 / 48`; PWA `192 / 512`;
apple-touch `180`. Do **not** wire any of these into `app.json` / the apps yet —
this folder is design-only until you sign off.

## Provenance

Adapted from Vision Menu's sibling project **RemCall** (`REMLY-AI`) — same owner,
same author. The construction method is carried over; the colour and the letters are
Vision Menu's.
