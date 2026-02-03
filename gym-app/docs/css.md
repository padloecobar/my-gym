# CSS Guide (Project-Specific, Short)

Use this with `docs/design-system/DESIGN_SYSTEM_CONTRACT.md`.

## Ownership
- `app/globals.css`: tokens, themes, reset, base, layout.
- `app/ui.css`: primitives, variants, states, component recipes.
- Feature/page styles (if added): **layout only** (no colors/radii/shadows/typography scale).

## Non-Negotiables
- No raw colors in component CSS; use tokens.
- Touch targets >= `--tap` (48px).
- Focus-visible must remain visible.
- Variants/states use data attributes (`data-variant`, `data-state`, etc.).

## Layer Order
```css
@layer reset, tokens, base, layout, components, motion, utilities, overrides;
```

## Modern Defaults
- Grid/Flex + `gap`
- Container queries when component sizing depends on container
- `:focus-visible` for accessibility
- Reduced motion respected via media queries and `data-motion-mode`

