# Door Formica / HPL finishes

31 October 2026. Post-Phase-22 refinement; no new numbered phase.

## Workflow

1. In `/admin/catalog`, add a **Finish**. Choose **Formica / HPL lamination**, enter its unique code/name and color, and optionally select a JPEG/PNG/WebP or an existing HTTPS image URL.
2. Save the unpublished finish, add its verified price and publish through the existing review controls. Pair it with supported board variants using each board's **Finishes** tab. Publication and compatibility remain explicit; creating an image does not silently publish a product.
3. In a cabinet, click a door and use **Select Finishings** in the left toolbar, or right-click the door and choose that action. Keyboard users can select a door from **Panels** and use the same toolbar action.
4. The left inspector shows compatible published Formica/HPL finishes as searchable image/color cards. Choose the door board first if it has no material assignment. Apply the finishing, then save the design normally. Cancel, Undo/Redo and recovery retain the existing transaction behavior.

Only the selected door's front finish changes. Its back/liner and edges are retained. Selecting a different underlying board explicitly replaces that panel's board/finish/edge assignment, matching the existing Materials workflow. Finishes remain `surface='laminate'`, not new board categories. All thickness measurements remain millimeters; lamination does not invent an added thickness allowance.

## Implementation and compatibility

Graphify's index at `4536ba2` located the existing catalog, material assignment and preview paths; local callers were inspected before editing. Existing `frontFinishId`, board compatibility, snapshot parsing, cloud validation, pricing and revision serialization are reused. No project fields or saved-design migrations are needed. Finish selection remains available in the existing Materials inspector as well.

The 3D raycast now passes the clicked panel identity directly to the context menu, preventing a right-click from editing the previously selected door. Successful textures use their own colors rather than being multiplied by the fallback swatch. Failed images retain the named color. Zero-sized canvas measurements during mobile inspector transitions are ignored so they cannot corrupt the camera.

Catalog uploads reuse bounded image reading and normalization: one JPEG/PNG/WebP, at most 10 MB and 20 megapixels, re-encoded to WebP within 2048 × 2048 pixels with metadata removed. The upload endpoint checks same origin and active catalog-admin membership before reading the body. Browser uploads never receive server credentials. Uploaded catalog swatches are public, as stated beside the upload control. Customer photos remain private and use their separate existing bucket.

HTTPS image URLs reject credentials, executable/file/data schemes and oversized values. External image hosts must permit browser texture loading; color fallback remains available when their CORS or availability prevents this. Uploaded images use immutable random object names. Images are not automatically deleted on catalog edits or retirement; replacement and failed-catalog-save assets may remain and need a future reviewed retention policy.

## Database status and verification

`202610310001_catalog_finish_images.sql` creates only the public `catalog-finishes` WebP bucket, capped at 10 MB. It adds no browser upload policy, grants no staff role and changes no existing private bucket or application table. Existing conflicting bucket configuration fails rather than being silently broadened. The owner approved it on 31 October 2026; it is **applied to linked Supabase**. A temporary normalized WebP uploaded and loaded publicly with matching bytes. Anonymous uploads were denied, private-photo storage stayed private, and temporary objects were removed. See [storage verification](../../project-records/door-finishes/20261031/storage-verification.json).

- 126 unit/database tests passed, including finish compatibility, save/hash round trips, unchanged geometry, URL validation and isolated bucket behavior.
- Four door/material browser checks passed: actual-door right-click, per-door selection, cancel, Undo/Redo, saved reload, successful image rendering, unavailable-image fallback, responsive rendering and anonymous/cross-origin upload denial.
- Nine isolated catalog browser checks passed, including image-upload failure preserving the form, retry saving the name/color/image URL, and closing an uploading form without creating a catalog record. Separate Add board, Add finish and Add edging buttons open dedicated form components that reuse the shared identity fields, inputs and save shell. Each submits only its own specifications. The shared code pattern now works with browser Unicode-set validation; invalid API inputs return field-specific errors rather than a misleading price/unit message. A measurement conversion browser check also passed.
- Types, lint and production build passed. Screenshot review corrected card styling and verified light/dark and mobile layouts.

Local review artifacts are under `artifacts/review/door-finishes/` and are excluded from Git. Browser tests use synthetic materials/test doubles; no customer catalog entries were created or published. Actual hosted bucket storage is verified, while the catalog-admin upload UI was tested in isolation rather than by creating a real staff catalog record. This work has not been committed, pushed or deployed.

## Proportional finish mapping

Finish images retain their pixel proportions. The image covers the assigned board's stock sheet without distortion, and each panel uses a centered crop at that physical scale. Height-grain assignments rotate the crop by 90 degrees. Oversize preview surfaces repeat rather than stretch. Missing stock dimensions use the existing nominal 4 × 8 ft sheet. Higher-resolution versions of the same image produce the same crop; image resolution does not change physical scale. Front and back maps use the same rule, including notched profiles. This uses Three.js texture UV matrices and repeat wrapping: https://threejs.org/docs/pages/Texture.html .

The crop is a visual preview, not the panel's nesting position or guaranteed grain matching across adjacent doors. Finish-specific sheet dimensions and crop positioning are not stored. Upload normalization retains image proportions within the existing 2048-pixel limit. Two focused mapping tests cover aspect ratios, rotation, scale, resolution invariance and repetition.

