Superseded by [Phase 9 completion report](phase-09-report.md). The partial-state record below is historical.

# Combined Phase 8–9 work in progress

The owner requested these two phases together. This is an implementation progress record, not an acceptance report.

Added a lazily loaded Three.js cabinet viewport using the shared physical-panel dimensions and transforms. Controls include orbit/pan/zoom, camera reset, exploded presentation, raycast panel selection and a native keyboard-accessible panel selector. Renderer resources, observers, controls and animation loops are disposed on unmount. WebGL initialization/context failure gives a message directing the visitor to the existing 2D views and cut list.

The viewport is embedded in the cabinet editor. Three.js and its TypeScript definitions are exact project dependencies.

Engineering checks: 28 existing unit/database tests, strict TypeScript and lint passed. These existing tests do not validate the new WebGL interactions. Browser/rendered verification and independent visual review remain outstanding. Neither phase is accepted.

Phase 9 is not implemented: per-panel catalog compatibility, material/finish/liner/edge/grain assignments, texture fallbacks, persisted versioned overrides, full undo/redo and thickness-driven neighbor recalculation remain required. Do not substitute temporary viewer colors for saved material identities. No hosted migrations or provider changes were made in this increment.

Manufacturing approval remains pending. The request covers both phases; completing only the viewer does not fulfill the combined task.

