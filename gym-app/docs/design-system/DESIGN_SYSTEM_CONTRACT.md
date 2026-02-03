# Design System Contract (CSS-First, Canonical)

Single source of truth for UI hooks. If TSX follows this contract, **themes change in CSS only**.

## Required Primitives
Use `ui-*` classes in TSX (legacy classes are aliases only).

- `ui-button` (variants: `primary|secondary|ghost|danger|neutral`, sizes: `sm|md|lg`)
- `ui-icon-button`
- `ui-card` + sub-elements `ui-card__body|title|meta` (`data-surface="1|2|3"`)
- `ui-row` (tap-able list row)
- `ui-chip`
- `ui-pill` + sub-elements `ui-pill__value|label`
- `ui-input` / `ui-select` / `ui-textarea`
- `ui-nav` (bottom nav) + `ui-nav__item|icon|label`
- `ui-header` + `ui-header__title|subtitle|row`
- `ui-sheet` + `ui-sheet__panel|header|title|content|footer|actions|list`
- `ui-snackbar`
- Optional: `ui-badge`, `ui-divider`, `ui-kbd`, `ui-skeleton`

## Data-Attribute API
These attributes are the contract:

- `data-variant="primary|secondary|ghost|danger|neutral"`
- `data-size="sm|md|lg"`
- `data-tone="strong"` (reserved: `default|muted`)
- `data-state="default|active|selected|disabled|loading"`
- `data-density="compact|comfortable"`
- `data-surface="1|2|3"`

ARIA usage:
- `aria-current="page"` for nav items
- `aria-pressed="true"` for toggles
- `disabled` or `aria-disabled="true"` for disabled UI

### Variant Notes
- Buttons: `primary|secondary|ghost|danger|neutral`.
- Badges: `primary|secondary|neutral|danger` (legacy aliases: `badge--success|badge--warn|badge--brand`).

## States & A11y
- Focus: `:focus-visible` uses `--focus-ring`, `--ring-size`, `--ring-offset`.
- Disabled: use `disabled`/`aria-disabled` and optionally `data-state="disabled"`.
- Selected/active: use `data-state="selected|active"`.
- Loading (buttons): `data-state="loading"` blocks interaction.
- Touch target: `--tap` (48px) minimum.
- Reduced motion: respect `prefers-reduced-motion` and `data-motion-mode`.

## Theming Mechanism
Themes switch by toggling one attribute:

```css
:root[data-theme="light"] { /* tokens */ }
```

Rules:
- Tokens and themes live in `app/globals.css` under `@layer tokens`.
- Component styling lives in `app/ui.css` under `@layer components`.

## CSS Layers
```css
@layer reset, tokens, base, layout, components, motion, utilities, overrides;
```

## Composition Rules
- Feature classes may **compose** primitives, not replace them.
- Feature classes may handle layout/spacing/placement only.
- Visual language (colors, radii, shadows, typography scale) belongs to primitives.

## Deprecation Policy (Legacy Classes)
- Legacy classes are allowed **only** in untouched legacy code or as CSS aliases.
- New code must use `ui-*` hooks + data attributes.
- Remove legacy usage opportunistically when touching the component or when usage is low.

## Adding Primitives / Expanding API
- New `ui-*` primitives must serve 2+ places and define focus/disabled states.
- New `data-*` keys require 2+ primitives and must be documented here.
- Any new visual token must be added in `globals.css`.

## Migration Quickstart
1. Add the `ui-*` class to the element.
2. Replace modifier classes with data attributes.
3. Add `ui-*` sub-element classes for card/pill/sheet parts.
4. Verify focus + disabled states with keyboard.

## Lint-Like Checks
- Inline styles: `rg "style=|style=\"|style=\{" app/`
- Hard-coded colors: `rg "#([0-9a-fA-F]{3,6})" app/ docs/`
- Deprecated modifiers: `rg "button--|btn--|pill--|chip--|badge--" app/`
- Missing hooks: `rg "className=\"(button|card|input|list-row)" app/`

