# Drawer materials and compartment doors — 25 October 2026

- Drawer box backs now use the back-board category and thickness, with their rear pose adjusted to preserve the outside box depth. Drawer faces retain the door-board category and thickness. Drawer sides and internal box fronts remain body board.
- Compartment doors span ordinary section dividers. Only external drawer sections interrupt their coverage. Existing zero/one/two leaf selections remain supported; nested external drawers under parent doors remain invalid.
- The open-door presentation now also extends all six pieces of each drawer by its complete box depth. Supports remain fixed. Closing restores the exact manufacturing poses; explosion suppresses opening displacement and reduced-motion behavior is retained.
- Material assignments remain explicit per panel, with the existing apply-to-category action. Changed door coverage can remove previous section door IDs; existing stale-material warnings still require review.
- Verified: 92 unit tests, TypeScript check. No database or saved-input schema changes.
