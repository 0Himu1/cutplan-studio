# CutPlan Studio Interface Design

Version 1.0 | 21 October 2026 | Product interface specification

The interface should help a customer make three decisions confidently: whether the furniture fits, whether the materials look right, and whether the quoted price is acceptable. Manufacturing detail remains accessible to operators without making customers understand nesting or machine settings.

This file specifies screens, components, interaction states and visual tokens. It is an implementation design specification, not an already validated Figma file or a usability-tested prototype. The master's Part 5 is the visual authority: calm, tool-focused, Notion-like structure with an indigo accent, light and dark modes, and restrained motion. Proposed dimensions and responsive behavior below make that direction implementable.

Related documents: [PRD](01_PRD.md), [TRD](02_TRD.md), [user flows](04_User_Flows.md), [database design](05_Database_Design.md).

## 1 Experience principles

Show the furniture as the primary object. Keep the selected component, dimensions, material assignment and save state visible. Place one clear primary action in each context. The editor's primary action is Get a Quote; the quotation's is Confirm Order.

Use ordinary furniture language with short explanations for unfamiliar terms. For example, label the hidden face finish “Inner finish” and explain liner in helper text. Avoid showing database IDs, AI provider names, packing algorithms or G-code parameters to customers.

Guest users should see that their current work is temporary. Authentication should interrupt only save or quote commitment and resume the intended task. Failure states preserve the last valid design and explain what the user can do next.

## 2 Information architecture

| Surface | Routes proposed for implementation | Audience |
| --- | --- | --- |
| Marketing | `cutplanstudio.com/` | All visitors |
| Studio home | `app.cutplanstudio.com/` | Guest or customer |
| Projects | `/projects`, `/projects/:id/edit` | Owner; guest current draft |
| Photo entry | `/start/photo` or dashboard dialog | Guest or customer |
| Shared design | `/share/:token` | Scoped read-only viewer |
| Quotation | `/quotations/:id` | Owner or admin |
| Orders | `/orders`, `/orders/:id` | Owner |
| Internal operations | `/admin/catalog`, `/admin/orders`, `/admin/orders/:id` | Admin only |

Home, Projects and Orders are the customer navigation. Guests selecting Projects or Orders see a useful empty state and Sign In, not somebody else's records. Internal tools have a separate navigation shell and authorization boundary.

## 3 Visual tokens

### 3.1 Required color palette

The following values come from the master. Text/control combinations require contrast checks; the palette does not guarantee that every combination meets WCAG AA.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg-base` | `#FFFFFF` | `#0F0F1A` | App background |
| `--bg-surface` | `#F3F4F6` | `#1A1A2E` | Sidebar and panels |
| `--bg-elevated` | `#E5E7EB` | `#252540` | Menus and dialogs |
| `--text-primary` | `#111827` | `#F9FAFB` | Main text |
| `--text-muted` | `#6B7280` | `#9CA3AF` | Secondary text |
| `--accent` | `#4F46E5` | `#6366F1` | Main actions and selection |
| `--accent-hover` | `#4338CA` | `#818CF8` | Interactive hover |
| `--border` | `#E5E7EB` | `#2D2D4E` | Dividers and input borders |
| `--success` | `#10B981` | `#34D399` | Positive state icons |
| `--warning` | `#F59E0B` | `#FBBF24` | Nonblocking warnings |

Proposed additional tokens: error text `#B91C1C` in light mode and `#FCA5A5` in dark mode; focus outline `#4F46E5` and `#A5B4FC`, respectively. Warnings and success states always include text or an icon, and color alone never conveys order status or invalid geometry. Do not use bright success/warning colors as small body text without measuring contrast.

### 3.2 Typography and spacing

Use Inter consistently for product text; Geist is an acceptable hero alternative from the master but should not create a second body font. Use JetBrains Mono only for technical readouts and admin machine details.

| Role | Weight | Size and line height proposed |
| --- | --- | --- |
| Hero | 700 | 48–72 px / 1.05 desktop; 36–44 px mobile |
| Page title | 700 | 32 px / 40 px |
| Section title | 600 | 24 px / 32 px |
| Panel heading | 600 | 18 px / 26 px |
| Body | 400 | 14–16 px / 20–24 px |
| Label | 500 | 12–13 px / 18 px |
| Measurement | 400 | 13 px / 20 px; tabular numerals |

Proposed spacing scale: 4, 8, 12, 16, 24, 32 and 48 px. Inputs and ordinary buttons are 40 px tall; compact desktop tool buttons may be 36 px with sufficient hit area. Touch controls are at least 44 by 44 px. Use 6 px control radius, 8 px panels and 12 px dialogs. Border width is 1 px. Avoid decorative gradients, repeated shadows and animated badges in the editor.

## 4 Screen specifications

### 4.1 Marketing landing page

Content order: logo and Try It Out navigation; brief hero describing custom-sized panel furniture; a clear statement of flat-pack Dhaka delivery; a furniture preview; one primary Try It Out action. Additional business terms must be factual and approved. Do not promise payment methods, delivery speed or unlimited structural freedom.

Required background motion uses sparse indigo/violet particles and slow connected waves. Render it behind readable content, pause it offscreen, and disable it for reduced motion or limited device performance. The master excludes scroll-triggered animation; it does not require hiding ordinary page content on short screens.

### 4.2 Studio dashboard

Use a home screen similar in structure to a creative tool: fixed left navigation, a top project action area and a recent-project grid. Each card has a thumbnail, name, family, last-edited date and overflow actions. New Project and Start from a Photo are visible entry points. A guest sees Continue current draft and a short explanation of saving.

Proposed desktop sidebar is 224 px; content has 24 px padding and cards use a responsive grid. Search and sort can be added without making them v1 business requirements. Paginate or use an internally scrolling project region when content exceeds the viewport. Do not clip older projects to satisfy the master's viewport-fit aesthetic.

Empty state: “Create your first furniture design” with New Project and Start from a Photo. Loading state: card skeletons. Failure state: retain existing cards if cached and show Retry. A missing thumbnail uses a furniture-type placeholder.

### 4.3 New project and photo entry

New Project asks for a name and one of the four supported furniture families, then opens valid defaults. Furniture-family labels use recognizable examples rather than construction jargon.

The photo flow first asks whether the photo shows a space or a furniture reference. Show accepted formats, size limit and a short image-use notice before upload. Separate upload progress from analysis progress. A space result displays 2 to 3 suggestion cards when available. A product result explains its template interpretation and any unsupported details.

Show estimated measurements as editable estimates with an explicit “Confirm your measurements” step. Confidence is not shown as a guarantee. A retry or Start Blank action is always available. The result must never imply that a photograph established exact physical dimensions.

### 4.4 Editor layout

The master describes a four-zone editor: top bar, left tool rail, central canvas and right AI panel. Proposed desktop dimensions make these concrete.

```text
+--------------------------------------------------------------------------+
| CutPlan | Project name | Save state | Undo Redo | Save | Get a Quote       |
+-----+-----------------------------------------------+--------------------+
|Tools| 3D  Front  Floor                              | Design / Assistant |
|     |                                               |                    |
|     |             Furniture canvas                  | Dimensions         |
|     |                                               | Components         |
|     |             Panel selection                   | Materials          |
|     |                                               |                    |
|     | [Panel list drawer when open]                 | AI conversation    |
+-----+-----------------------------------------------+--------------------+
| Measurements in mm | Fit view | Zoom | Validation summary                 |
+--------------------------------------------------------------------------+
```

Top bar: 56 px high. Tool rail: 56 px wide. Right panel: 320–360 px wide and resizable within limits. Panel-list drawer: approximately 280 px, collapsible over or beside the canvas when space permits. The canvas consumes the remaining area; controls never overlap critical quote actions.

The right panel keeps the required AI conversation but also offers a direct Design tab with dimensions, components and materials. This is a proposed usability addition: customers must not be forced to use AI to perform an ordinary edit. Both tabs issue the same validated domain commands.

Top-bar Export is not a public CNC action. Proposed customer menu contains Design Summary and, when issued, Quote PDF. Admin production export belongs in the order workspace. Disable unavailable actions with a reason rather than presenting an apparently working pre-order CNC button.

### 4.5 Editor behavior and states

| Interaction | Behavior |
| --- | --- |
| Numeric change | Debounce calculations while typing; commit valid value on blur/Enter; invalid input preserves last valid geometry |
| Slider | Update a local preview while dragging; create one undo step on release; do not send a quote request on every frame |
| Select panel | Highlight mesh and matching panel-list row; show label, dimensions, material and visible-edge assignments |
| Hover | Subtle highlight with no mesh scaling; avoid implying a material change |
| Right-click | Panel context menu for material, front finish, inner finish and edging |
| Keyboard/touch selection | More button or inspector opens the same actions without right-click |
| Canvas wheel | Zoom while pointer/focus is over canvas; do not intercept form-panel scrolling |
| Orbit/pan | Pointer controls plus visible toolbar mode and keyboard-operable buttons |
| Exploded view | Presentation-only transformation; stored manufacturing coordinates remain unchanged |
| Fit view | Reset camera to contain furniture and meaningful context |
| Undo/redo | Restore configuration and overrides; save and quote state become stale as appropriate |
| New geometry | Reconcile selection by stable panel ID; if removed, clear selection and explain |
| Background save | Show Saving, Saved or Save Failed independently of calculation state |
| Material thickness change | Recalculate neighboring parts; show resulting validation issues before quote |

Geometry statuses: valid, calculating, invalid configuration, unsupported template. Persistence statuses: guest temporary, unsaved, saving, saved, conflict, offline/failed. Quotation statuses: none, generating, current, stale, expired. These are distinct: a design may look valid but remain unsaved, and a saved design may have an expired quote.

For a save conflict, offer Reload Server Version or Save as Copy after preserving local recovery. Do not silently overwrite another tab's changes. For WebGL failure, show the 2D/parameter fallback and a meaningful explanation; disable misleading 3D controls.

### 4.6 Panel materials inspector

Hierarchy: selected panel name and dimensions; board type/brand/thickness; visible face finish; inner face finish; four exposed-edge controls; grain direction. Disable incompatible combinations and explain why. Texture swatches show a code and readable name. If a texture fails to load, show its base color and label rather than removing the material assignment.

“Apply to matching panels” must state the affected panel count and matching rule. It creates one undoable command. Use explicit face names because the “front” of a horizontal shelf differs from the front of the whole cabinet. Edges refer to the panel's local orientation and should be visualized before confirmation.

### 4.7 AI assistant

Show short examples such as “Add a shelf” and “Make it 10 cm wider.” A response identifies the proposed changes, the affected parts and any material override loss. Apply and Discard are explicit controls. After apply, offer Undo. The assistant cannot confirm orders or change price rules.

Pending responses are attached to the revision they were requested from. If the customer edits meanwhile, mark the proposal stale and regenerate or revalidate before apply. Provider errors use Retry and manual Design controls; the editor remains usable.

### 4.8 Authentication dialog

One email field, Send Code, six-digit code input and Verify. Support paste and auto-fill where available. Include resend cooldown, masked email, Change Email and Cancel. Preserve the return action and guest draft across retries.

Copy distinguishes temporary exploration from an account save: “Sign in to save this design” or “Sign in to get your quotation.” Do not suggest that authentication alone confirms an order. On success, show the claimed draft as saved and resume save or quote generation.

### 4.9 Quotation

Use a cart-like layout with furniture thumbnail/name, key dimensions, materials, quote number, issued date and expiry. Display material groups and sheet quantities, finish/edging items when chargeable, labor, fixed Dhaka delivery and total. Assembly guide appears as included, not an unexplained charge.

Show a compact material summary with stock dimensions, sheet count and clearly labeled non-panel/waste area. The customer must not see partner costs or internal margin. Use `BDT 12,500.00` consistently; a currency glyph can be added if it renders reliably.

Actions: Download PDF, Email Quote, Back to Edit and Confirm Order. Editing warns that a new quote will be needed. If expired, Confirm Order is replaced with Refresh Quote. Failed PDF/email generation is reported next to that action and does not hide a valid quote.

At confirmation, collect recipient name, phone, allowed Dhaka area, street/building details and delivery notes. Show the exact accepted amount and dimensions again. Label the action Confirm Order until a separate payment policy exists. Do not show “Paid” without payment evidence.

### 4.10 Order list and tracking

Each row/card has order number, furniture name, confirmation date, total order value and current status. The detail screen has a four-step timeline, accepted furniture summary, address, contact details and assembly guide when ready.

Statuses are Confirmed, In Production, Ready for Delivery and Delivered. Delayed production files are not a new customer order status; use a factual notice if they affect delivery. Avoid promising delivery dates unless operations has set them. The master's “total paid” field becomes Order Total until a verified payment record exists.

### 4.11 Shared design

Use a visible Read Only badge and a limited toolbar for view, zoom and panel inspection. Hide private upload history, AI conversation, address, internal pricing and production exports. A sign-in action may allow the owner to reopen the original; another user must not acquire edit rights simply by signing in. A proposed Save a Copy action requires product approval and an explicit permitted-copy policy.

### 4.12 Admin workspace

Keep catalog editing and orders separate. Catalog tables expose board dimensions, thickness, brand, customer-price fields, availability and price effective time. Destructive changes retire referenced catalog items instead of erasing order history.

Order detail groups customer information, accepted design snapshot, quote, status history, eligible manufacturer bids, selected machine profile and production artifacts. Provide separate Generate/Retry, Review and Download actions. Display revision and machine profile near manufacturing downloads. Warn on missing profile, unplaced panels or unqualified operations; do not provide a bypass button in ordinary operation.

Status updates need a clear next state and optional operational note; record actor and time. Internal manufacturer quotes and costs must never appear in customer views or public share links.

## 5 Component inventory

| Component | Shared behavior and states |
| --- | --- |
| AppShell / AdminShell | Separate navigation, active route, account menu, theme switch |
| ProjectCard | Skeleton, thumbnail fallback, owner actions, last-edited label |
| FurnitureTypePicker | Four supported families with valid defaults |
| DimensionField | Unit label, numeric validation, min/max explanation, slider equivalent |
| ComponentTree | Stable selection, shelves/doors/drawers, keyboard traversal |
| FurnitureViewport | 3D/2D modes, loading, WebGL fallback, selection and fit controls |
| PanelInspector | Compatible material choices, edge mapping, grain control |
| SaveIndicator | Guest, saving, saved, failure and conflict |
| AssistantPanel | Pending, proposal, stale, invalid, apply and undo |
| OtpDialog | Email, code, cooldown, expired code and preserved return action |
| QuoteBreakdown | Snapshot totals, validity, PDF/email statuses |
| OrderTimeline | Four supported states with timestamps and accessible text |
| ProductionFiles | Queued, awaiting profile, failed, reviewed, ready and checksum metadata |
| ErrorSummary | Field links, plain-language explanation and retry without draft loss |

Build these with shadcn/Radix primitives and Tailwind tokens. Audit any reused legacy component for focus behavior, headings, labels and contrast rather than inheriting its styling unchanged.

## 6 Responsive and accessible behavior

Proposed breakpoints: full editor at 1280 px and above; collapsible inspector at 1024–1279 px; tabs/sheets for 768–1023 px. Below 768 px, provide usable parameter editing, preview, quote review and order tracking; advanced 3D arrangements may use a simplified mode. Product must approve the exact mobile configurator scope under PRD D08.

The main editor shell has no document-level scrolling while its numeric controls, AI history and panel list scroll internally. Do not disable scrolling globally across marketing, checkout or phone layouts. At 200% browser zoom, important controls and error messages remain reachable.

Target WCAG AA. Provide visible focus, dialog focus trap and return, semantic labels, text error messages and keyboard alternatives for drag, right-click and camera motion. Announce calculation and save status politely without narrating each slider frame. 3D content needs a textual panel/configuration equivalent. The canvas must not trap the keyboard.

Suggested shortcuts: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z redo, Escape clear selection/close context, F fit view when canvas-focused, and Ctrl/Cmd+S request save. Scope shortcuts so typing in fields is unaffected. Shortcuts must be discoverable and not the sole access path.

## 7 Motion and feedback

Required page transition is a 150 ms fade; no sliding or bouncing. Use a short camera ease into the initial isometric view, subtle hover indication and no scroll-triggered editor animation. Reduced-motion mode removes decorative particles and animated camera movement. Loading skeletons apply to fetched panels; progress labels or bars are more appropriate for uploads and long-running quote/production jobs.

## 8 Design acceptance checklist

- All six master screens exist, including internal operations and customer order tracking.
- Light and dark modes have checked contrast, visible focus and valid disabled states.
- A guest can make a valid design, cancel login, and continue without losing it.
- Exact measurement confirmation is required after a photo-based start.
- Manual controls and AI commands create the same result and undo correctly.
- A panel's highlighted geometry, label and material assignment agree across views.
- Expired/stale quotes cannot be confirmed and show a useful next action.
- Customers never see partner costs, machine parameters or private production files.
- Internal overflow, touch menus, keyboard controls and WebGL fallback are usable.
- A fresh customer can finish a supported design and understand the final order value without learning manufacturing terminology.

## 9 Legacy assets and planned differences

Reuse the R3F scene and panel mesh patterns, Radix primitives, unit input utilities and quotation layout ideas. Replace the step-heavy Cabinet/Panel Cuts/CNC navigation with the dashboard/editor/quote/order journey. Replace Solution Provider company details in quotation headers/footers with approved CutPlan business information. Existing placeholders, logos, textures and product images require provenance checks before use.

The master document's design direction takes precedence over personal portfolio styling or the old UI. Customer-facing production settings and arbitrary SVG conversion screens remain outside the customer navigation.
