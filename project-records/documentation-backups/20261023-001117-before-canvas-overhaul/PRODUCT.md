# CutPlan Studio

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

The supplied master requirements specify Next.js App Router, TypeScript, Tailwind and shadcn/Radix, React Three Fiber, Zustand, Supabase Auth/PostgreSQL/Storage and MongoDB designs. Phase 1 establishes the Next.js and Supabase foundation. The remaining components are added when their phase needs them. The owner has requested phase-by-phase implementation with review after each checkpoint.

## Users

Homeowners and furniture buyers in Dhaka who need furniture to fit their spaces without CAD expertise. CutPlan staff maintain catalog prices and fulfill orders. Manufacturer portals are excluded from v1.

## Product Purpose

Configure panel furniture, inspect it in 2D and 3D, receive an itemized BDT quote, and order flat-pack delivery with an assembly guide.

## Capabilities and Constraints

Cabinets, shoe racks, bookshelves and panel tables. Guest exploration, Google sign-in on save or quote (email OTP retained as an inactive option), seven-day quotations, Dhaka-only delivery. No subscriptions, metal or solid wood products, or invented payment policy. Photo-derived dimensions need human measurement confirmation. A committed order uses an immutable design and price snapshot.

## Brand Commitments

CutPlan Studio. Plain English and calm, tool-focused interfaces, with the master's light/dark palette and indigo accent. The master explicitly names Notion-like restraint and an Adobe-style studio dashboard. Requirements are in docs/requirements; implementation design context is in docs/design.

## Evidence on Hand

The owner-supplied master is docs/requirements/Cutplan_Studio_Master_Document.docx. Five detailed requirement files sit beside it. The existing cabinet project is a reusable-code reference, not the new app's visual or access-control authority. No real customer projects, testimonials, prices or delivery times have been supplied.

## Product Principles

One calculation source for visual geometry and physical panels. Preserve work through failed requests. Use server-validated pricing and access checks. Keep machine settings within staff operations. Deliver one verifiable phase at a time.

## Accessibility and Inclusion

WCAG AA, visible focus, keyboard alternatives, reduced motion and light/dark support. The complex editor is desktop-first with usable smaller-screen fallbacks.

## Open Decisions

Construction fixtures, real catalog prices, delivery areas, payment/tax/cancellation policy, MongoDB provisioning and qualified machine profiles remain open. Phase 1 makes no assumptions that commit these policies.
