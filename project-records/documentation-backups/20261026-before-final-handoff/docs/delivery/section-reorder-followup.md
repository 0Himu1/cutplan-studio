# Drag-and-drop cabinet sections — 25 October 2026

Each section header now has a six-dot reorder handle. Dragging with a mouse, pen or touch fades the source and shows an indigo insertion marker. Dropping commits one reordered section array; the entire section retains its ID, dimensions, automatic/manual choice, shelves, drawers, rods, nested slots and material identities. Normal Apply/Save, recovery and Undo/Redo remain unchanged. Positions continue to run bottom to top.

Dragging is handle-only, so ordinary inputs and the rest of the inspector remain touch-scrollable. Near an inspector edge, a requestAnimationFrame loop scrolls the list while recalculating the insertion point. Geometry reads precede scrolling writes. Pointer capture retains the interaction; Escape, pointer cancellation, lost capture and dropping outside the compartment clear it without applying a move. Reordering stays within the current compartment, including nested slots.

Keyboard users can focus the handle and use Arrow Up/Down to change list position, or Home/End to move to its first/last position. Focus follows the same section after reordering; a screen-reader status announces the new position. Existing arrow controls remain available. A single section has a disabled handle. Header-handle interaction does not toggle its accordion; open/closed state is retained. Feedback uses a short opacity transition, disabled by the existing reduced-motion rule.

Verification: four new browser scenarios passed for mouse drag, cancellation, saved reload and Undo/Redo; nested keyboard movement and retained focus; real touch input on a phone with unchanged height budgets; and auto-scroll/outside-drop behavior. Five existing cabinet browser scenarios also passed. A pure unit check verifies exact identity/configuration retention, divider-aware allocation, valid persistence, invalid destinations and reversible order. TypeScript and ESLint pass. Review screenshot: artifacts/review/section-reorder/touch-drop.png.

No schema, construction-rule, stock, phase-number or production-release changes are required.
