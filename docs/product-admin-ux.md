# Product Admin UX refresh

Reference inspected: `C:/tranh-tran-vien/apps/backend/src/admin/widgets/ttv-product-explore-widget.tsx` and the product-list widget.

The reference keeps native Medusa Products for commerce and adds primary-image cards with their own galleries. Its compact cards and collapsed advanced information were retained as the layout model, without copying its image-based identity or deletion behavior.

## Applied in Metal

- A concise heading and one primary Add design action.
- Compact 4:3 card frames preserving actual artwork geometry; stable number, status and gallery count.
- Search by design name and filter visible/hidden designs.
- Upload review and per-design editing in Medusa drawers; scrollable content instead of forms expanding the whole Product page.
- Gallery actions and archive grouped under a collapsed section on each card.
- Legacy import/help section removed from the Admin UI at the user's request; stored images and backend migration support are retained.
- Hexagon artwork uses a point at the top and bottom, consistently in Admin, storefront cards and 3D edges.
- Drag/drop empty state, file-level upload status/retry and confirmation before discarding pending uploads.
- Primary-artwork editing supports direct pointer dragging and cursor-anchored wheel zoom, replacing the three sliders. Bounds prevent exposed background and a Reset action restores centering. Arrow and +/- keys provide a keyboard alternative.

Native Product creation, pricing, variants, SKU and the existing APIs remain unchanged. This is a refresh of the image-design creation/management experience within Product details, not a replacement for the native Product creation wizard.

## Verification

- TypeScript passed.
- Four crop-math regression tests passed (pixel-accurate dragging, cursor anchoring, boundary reversal and shape coverage).
- Backend and Admin production build passed on retry. Lint reported eight existing warnings, zero errors.
- Chromium smoke test with fixture data and real Medusa UI components passed: card layout, name search, edit/save drawer, upload preview/submit/close, mobile width.
- No real catalog data was changed by these UI tests.
