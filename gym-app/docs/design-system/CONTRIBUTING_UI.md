# Contributing UI (Short)

## Add a Component
1. Use existing `ui-*` primitives and `data-*` attributes.
2. Put new styles in `app/ui.css` (`@layer components`).
3. Use tokens only (no raw colors/spaces).
4. Verify focus-visible + disabled states.

## Feature Classes
Feature-specific classes are allowed **only** to compose primitives.
- Must be used alongside a `ui-*` primitive.
- May change layout/spacing/placement only.
- Must not define colors, radii, shadows, or typography scale.

## Pre-merge Checklist
- Uses `ui-*` hooks and data attributes.
- No hard-coded colors outside `globals.css`.
- Touch targets >= 48px.
- Theme switching works via `data-theme` only.

Lint-like checks live in `DESIGN_SYSTEM_CONTRACT.md`.

