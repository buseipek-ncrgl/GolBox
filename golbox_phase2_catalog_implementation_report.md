# GölBOX Phase 2 Catalog Implementation Report

Date: 2026-10-05

## 1. Existing Architecture Found — IMPLEMENTED

- Admin: React/Vite/TypeScript under `frontend`.
- Customer: Next.js/React/TypeScript under `GölboxFrontend`.
- Backend: ASP.NET Core 9, EF Core, SQLite development database.
- Existing `MenuItem`, `CafeCategory`, `Order`, `OrderItem` and branch entities were extended rather than replaced.

## 2. Problems Found — IMPLEMENTED

- Product editing and customer customization contained hard-coded ingredient, allergen, size and milk data.
- Admin list was a low-density card wall.
- Catalog entities existed but were not wired through the API/UI flow.
- Order creation did not validate option ownership or calculate option prices on the server.
- Global catalog writes allowed staff through the broad staff/admin policy.

## 3. Database Changes — PARTIAL

- Catalog relations cover ingredients, allergens, product option groups/options, product relations and branch-product availability.
- Order items persist product, selected option and final price snapshots.
- Remaining production gap: branch-specific option availability is not yet represented.
- Legacy `MenuItem.CafeId` remains as a compatibility anchor; ownership is now determined by branch availability, but the column has not yet been made nullable/removed.

## 4. Migration Changes — IMPLEMENTED

- Added `20261005193000_AlignCatalogOptionSchema` to safely align option group/value columns with the current model and backfill legacy values.
- Migration was successfully applied to the local SQLite database.

## 5. Backend Changes — PARTIAL

- Product CRUD now persists category, ingredients, allergens, generic option groups/options and branch availability.
- Relationship replacement avoids duplicate branch-product key collisions.
- Order validation rejects foreign/inactive options, enforces min/max requirements and calculates final price from database values.
- Remaining: recommendation management, system-derived new/popular badges and branch option availability.

## 6. API Changes — IMPLEMENTED

- Added `/api/v1/catalog` metadata and category/ingredient/allergen management endpoints.
- Expanded admin menu payload with category, definitions, options and branch coverage.
- Expanded branch customer menu payload with real ingredients, allergens and customization groups.
- Order request accepts only selected option IDs; prices are not trusted from the client.

## 7. Admin UI Changes — IMPLEMENTED

- Replaced the catalog card wall with a compact operational table, search/filter controls, coverage summaries and clear empty/loading states.
- Added a wide, sectioned product editor for product info, content/allergens, generic customizations, branch availability and publication.
- Added inline master-data creation for category, ingredient and allergen definitions.

## 8. Customer UI Changes — IMPLEMENTED

- Selected branch menu is loaded from the real customer menu endpoint.
- Product detail renders server-provided ingredients, allergens and arbitrary single/multiple option groups.
- Cart carries selected option IDs to order creation.
- The active application no longer consumes the legacy hard-coded product-detail implementation.

## 9. Branch Integration — PARTIAL

- Product visibility and order eligibility use branch-product availability.
- Changing selected branch refetches the appropriate branch menu.
- Remaining: explicit branch-option availability and full cart warning/revalidation on branch change.

## 10. Removed Hard-Codes — PARTIAL

- Active menu and product-detail paths no longer use hard-coded product/category/customization/allergen business data.
- An unused legacy `product-detail-screen.tsx` remains in the tree because it overlaps pre-existing work; active imports point to `catalog-product-detail-screen.tsx`.

## 11. RBAC Changes — IMPLEMENTED

- Global catalog list/create/update/delete and master-data writes require `AdminOnly`.
- Staff can no longer change global product definitions/prices through these endpoints.

## 12. Audit Changes — PARTIAL

- Existing order/status audit remains intact.
- Catalog mutation-specific audit records are not yet added and are a production blocker for the full specification.

## 13. Tests Added — IMPLEMENTED

- Server-authoritative option price calculation and order snapshot test.
- Foreign-product option rejection/manipulation test.

## 14. Tests Executed — IMPLEMENTED

- Backend Release build: PASS, 0 warnings, 0 errors.
- Backend full suite: PASS, 113/113.
- Customer Next.js production build: PASS.
- Customer TypeScript `tsc --noEmit`: PASS.
- Admin Vite production build: PASS.
- Browser E2E: NOT TESTED.

## 15. PASS

- Dynamic categories/ingredients/allergens/options flow from admin to database/API/customer.
- Backend-authoritative option pricing and immutable order option/price snapshots.
- Product branch availability and selected-branch customer menu.
- Admin-only global catalog mutation.
- Compact, responsive catalog/product editor redesign.

## 16. FAIL

- None among the executed automated checks.

## 17. BLOCKED

- Full Definition of Done remains blocked by unimplemented branch-specific option availability, catalog audit coverage, recommendation management, computed new/popular badges and browser E2E verification.

## 18. Files Changed

Primary Phase 2 files:

- `backend/GolBox.Api/Controllers/CatalogManagementController.cs`
- `backend/GolBox.Api/Controllers/MenuCatalogController.cs`
- `backend/GolBox.Api/Controllers/MenuItemsController.cs`
- `backend/GolBox.Api/Controllers/OrdersController.cs`
- `backend/GolBox.Persistence/Migrations/20261005193000_AlignCatalogOptionSchema.cs`
- `backend/GolBox.Tests/CatalogPricingTests.cs`
- `frontend/src/features/admin/menu/CatalogMenuPage.tsx`
- `frontend/src/features/admin/menu/CatalogProductDrawer.tsx`
- `frontend/src/services/api.ts`
- `frontend/src/index.css`
- `GölboxFrontend/lib/golbox-context.tsx`
- `GölboxFrontend/components/golbox/screens/menu-screen.tsx`
- `GölboxFrontend/components/golbox/screens/catalog-product-detail-screen.tsx`

## 19. Remaining Risks — PARTIAL

- Option stock cannot yet vary per branch.
- Branch change does not yet preserve the cart with per-option incompatibility warnings.
- Catalog mutations need explicit audit events.
- Category reuse through `CafeCategory` lacks the richer slug/description/archive fields requested for a dedicated product taxonomy.
- The end-to-end admin-to-customer scenario should be verified in a real browser session before production release.
