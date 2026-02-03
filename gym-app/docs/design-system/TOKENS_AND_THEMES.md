# Tokens and Themes (Short)

All visuals are token-driven. Tokens live in `app/globals.css` under `@layer tokens`.

## Required Theme Token Set
A theme must provide at least:
- Surfaces: `--surface-0/1/2/3`, `--bg`
- Text: `--text-1/2/3`, `--placeholder`
- Strokes: `--stroke-1/2`, `--stroke-inner`, `--stroke-outer`
- Focus: `--focus-ring`
- Elevation: `--shadow-1/2/3`
- Glass: `--glass-*`, `--surface-noise`, `--surface-highlight`
- Accents: `--brand`, `--danger`, `--success`, `--warning`

## Token Naming (Brief)
- Semantic tokens: `--surface-*`, `--text-*`, `--stroke-*`, `--focus-ring`.
- Raw tokens: `--space-*`, `--fs-*`, `--r-*` (used to build semantic tokens).
- Component tokens are allowed only when a semantic token is insufficient.

## Theme Switching
Toggle a single attribute on `:root` (or `html`):

```css
:root[data-theme="light"] { /* light tokens */ }
:root[data-theme="mango-voltage"] { /* dark tokens */ }
```

See `DESIGN_SYSTEM_CONTRACT.md` for non-negotiable rules.

