# Product designs implementation

## Accepted behavior

- A Medusa Product groups designs sharing native pricing, options and variants.
- Each uploaded primary artwork creates one design with a stable ID.
- Default new names are `<product title> 001`, `002`, etc. Gallery uploads do not consume numbers.
- Each design owns its primary artwork, shape/crop and supplementary gallery.
- Only the primary artwork offers 3D. Gallery selection never changes the purchased design.
- Listing cards have a uniform rectangular frame; artwork retains its shape inside it.
- Existing image names and `?img=N` mappings are preserved during migration.
- Cart snapshots and retained media preserve previously purchased artwork.

## Work checklist

- [x] 1. Design module, validation, stable identity and migrations.
- [x] 2. Admin workflows: import legacy images, upload/retry, edit, gallery, archive.
- [x] 3. Product detail Admin widget with upload preview and shape/crop controls.
- [x] 4. Storefront design cards, exact design pagination, detail gallery and primary-only 3D.
- [x] 5. Stable wishlist references and server-validated cart snapshots.
- [x] 6. Data migration, regression tests, type checks, lint and builds.

## Implementation decisions

- Store designs in a custom module with read-only Product links through `product_id`.
- Keep immutable sequence numbers and archive designs instead of reusing numbers.
- Keep media files on archive/removal so order snapshots remain usable. Storage garbage collection is a separate explicit operation.
- Keep the existing Product handle and use `?design=<stable ID>`; resolve old `?img=N` through persisted legacy mappings.
- Use Medusa's upload provider and commerce APIs. Never calculate checkout prices in the image layer.
- Upload files individually with a request ID, per-file result and retry. Validate decoded image bytes on the server.
- Serialize product writes and enforce database uniqueness/version checks to detect concurrent edits.

## Verification cases

- Upload 3 primary images, append 2 galleries, create next design: numbers 001–004.
- Reorder/remove gallery and replace primary: design ID/name/link unchanged.
- Retry an accepted upload after a lost response: no duplicate design/gallery.
- Two designs sharing a variant remain distinct cart lines.
- Forged title/URL, inactive design and mismatched variant cannot bypass server validation.
- Legacy images retain their original names and links after import.
- Portrait, landscape, hexagon and multi-panel artworks fit the same card frame.
- Gallery has zoom only; primary 3D uses only the artwork, never the card background.
- Admin edits become visible after the existing storefront cache revalidation window.

## Verification completed (2026-09-10)

- Backend and storefront production builds passed. Backend and storefront TypeScript checks passed separately.
- Four unit tests passed; four isolated HTTP integration tests passed (uploads/retries, stable identity, gallery promotion, cart isolation, migration/wishlist, retention and authentication).
- Chromium component smoke test passed for original, portrait, landscape, hexagon and three-panel shapes: primary 3D opens, gallery hides 3D, returning to primary restores it without navigation.
- Focused storefront lint passed. Backend build reports existing wishlist direct-mutation and seed currency warnings, no lint errors.
- Local database migrations applied. Legacy migration ran successfully with zero eligible products in the local catalog. Production data was not touched.

## Usage and deployment

1. Create a native Medusa Product with pricing/options/variants as usual.
2. Open its detail page and the design-management widget. Add primary images, review names/shapes, then upload. Each image creates one independently selectable design.
3. Add supplementary photos inside a design's gallery. Shape and crop belong to the primary artwork, not to the gallery.
4. On the first upload, existing Product images are preserved as legacy designs. Later native Media changes require the explicit import button.
5. Before deploying the updated applications, run `npm exec medusa db:migrate` from `apps/backend`; then run `npm exec medusa exec ./src/scripts/migrate-product-designs.ts` to migrate eligible legacy products/wishlist entries. Back up production data first.

## Boundaries and follow-up

- Removed the extra print-on-demand/default-option widget at the user's request. Inventory remains configured through the native variant Manage inventory field.
- Native Admin remove-only option requests now update variant option references and Product option associations together, preserving IDs, SKU and prices. This includes removing the final option from a single variant. Removal that would collapse distinct variants is rejected without deleting data. Shared options on other products are untouched.
- Six HTTP integration tests passed, including native option removal, final-option removal, duplicate-variant protection and adding quantity two without stock records.
- Variant price rendering tolerates null price-list details and zero prices. Singleton options are preselected; the internal Default option is hidden from customers.

- Design pagination is exact but currently fetches all matching native product pages before slicing designs. A dedicated indexed design-listing endpoint is the next optimization for a large catalog.
- 3D is a lightweight CSS plate preview with explicit geometric shapes and crop controls; it does not automatically extract arbitrary silhouettes or remove backgrounds from flattened photos.
- Browser verification covered isolated storefront components, not a complete authenticated Admin-to-payment end-to-end session. Visually review real artwork on desktop/mobile before release.
- Archived/gallery-removed artwork is retained intentionally for historical orders. Storage cleanup requires a separate retention policy.
