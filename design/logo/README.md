# Vision Menu — Logo (3D direction)

A fresh, **3D-forward** exploration that ties the mark to the product idea: *vision* (a lens/eye that brings a dish into focus) and *premium dining* (a cloche reveal). Dimensionality is real — radial/linear gradient shading with a consistent top-left light source, a beveled champagne-gold rim, a specular highlight, and a soft contact shadow — not a flat glyph.

Palette is strictly **Bordeaux Noir**: wine `#A31D33` (lit `#CB374F`, shadow `#6C1524`), champagne gold `#D9B24A`/`#A9822B`, ink `#1A1512`, off-white `#FFF7F3`. Gold stays an accent (rim, focus, edge-light).

The previous flat-monogram set is preserved in **`backup-v1/`**.

## Concepts

1. **The Lens — recommended.** A glossy 3D lens/eye: beveled gold rim, domed wine body, a champagne "focus" at the centre with a wine **V** carved into it. Reads as *Vision* + a *viewfinder* (fitting for an AR menu), and it's unmistakably premium at app-icon scale. Fully geometric — no font needed. → `mark.svg`
2. **Extruded V.** An isometric, extruded serif-less **V** with a lit front face, a dark extruded side, and a gold top edge-light. Bold, iconic, font-independent. → `mark-v-3d.svg`
3. **Cloche.** A dimensional fine-dining serving dome with a gold finial and base — the "reveal" moment of a premium meal. → `mark-cloche.svg`

Supporting files: `app-icon.svg` (1024 iOS tile — the Lens on a wine-gradient tile, safe margins), `lockup.svg` (mark + "Vision Menu" wordmark, serif "Vision" + tagline).

## Review
Open `index.html` in a browser — every concept is shown on dark and light panels at 168 / 72 / 36 px plus the app icon and lockup.

## A note on process
Your account hit its session/usage limit while this was in progress (it also cut short the two AR research agents), so the deep-research spree was deferred. These concepts were authored directly using premium 3D-logo craft. Once the limit resets we can do the full internet-research pass and iterate on the chosen direction.

## Exporting to PNG (no rasteriser is configured in this repo)
Pick one:
- `rsvg-convert -w 1024 -h 1024 app-icon.svg -o app-icon-1024.png`
- `npx @resvg/resvg-js-cli app-icon.svg app-icon-1024.png --width 1024`
- or open in Figma/Inkscape/Illustrator and export.
Wordmark text in `lockup.svg` should be converted to outlines at production so it renders without the Playfair/Inter fonts installed.

## Not wired into the apps yet
Nothing here touches `app.json`, the web `Logo` component, or any code — these are concept files only. Say the word and I'll wire the chosen mark into the app icon, splash, and headers.
