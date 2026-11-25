# Original design reference for Phase 2

The original application is preserved in `../backup-original/`. These are references, not a specification to copy unchanged: Phase 2 should improve on the original while retaining its tailoring identity.

## Identity and hierarchy

- `index.html` loads Bricolage Grotesque for display and Hanken Grotesk for body text. The current React interface uses system fonts, so the distinctive display hierarchy is missing.
- `styles.css` defines a forest-green cutting-mat palette, warm yellow measuring tape, ivory surfaces, thread-red alerts, dark theme, rounded controls and dashed ledger dividers. The current tokens retain green and gold but simplify the original visual hierarchy.
- The original uses a ruler logo and tape markings, a four-column ledger, date tags, order timeline, compact status pills, measurement tiles, and a receipt with a torn-paper edge. The current layout simplifies or omits these treatments.
- The original desktop rail and raised mobile new-order button are more distinctive than the current navigation. The old login hero and its animated tape are intentionally not migrated because this phase excludes authentication.

## Garments and interaction

- `app.js` contains `SHIRT_PATH`, `PANT_PATH`, `ART`, and `MEASURE_ART` (around lines 62–81). The original garment selection cards show silhouettes; measurement panels connect focused inputs to highlighted, animated SVG measurement lines. These illustrations and indicators are absent in React.
- The original wizard has labeled steps, a measuring-tape progress bar, quantity steppers, date shortcuts, and animated step changes. The React wizard keeps the underlying workflow but presents simpler controls.
- The original dashboard has animated count-up statistics, a seven-day delivery bar chart and collection donut. The current dashboard retains operational counts and delivery list, but not those visualizations.
- The original order detail opens as a sliding sheet with scrim; the receipt uses a centered dialog, and save feedback includes a stitched check animation. The React version uses full pages and an inline receipt.

## Motion reference

In `styles.css`, keyframes `pull`, `fade`, `slideR`, `slideL`, `march`, `shake`, `pulse`, `spin`, `draw`, `toastIn`, and `rise` appear around lines 534–545. Other transitions cover progress, garment selection, SVG measurement lines, dashboard bars, the payment bar, dialogs and the order sheet. `prefers-reduced-motion` is handled around line 596. `countUp` and `numberTape` in `app.js` implement additional motion.

For Phase 2, use these as inspiration for a more refined result, validate motion with reduced-motion preferences, and retain useful interaction feedback. Do not treat the old demo authentication, storage, sample records or hardcoded garment definitions as production assets.
