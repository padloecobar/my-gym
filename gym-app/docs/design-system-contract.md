# Design System Contract — Aurora Glass (Gym App)

This contract defines the **visual system** for the app. It is the source of truth for tokens, component recipes, and allowed patterns. No business logic is implied.

## 1) Design Intent
- Aurora gradient background with glassy panels and soft glow accents.
- Warm but modern: creamy surfaces layered over deeper contrast.
- One coherent component family: shared radii, shadows, focus, and spacing.
- Token-first + accessible: visible focus ring, 48px tap targets, reduced-motion safe.

## 2) Tokens

### 2.1 Primitive Tokens (Light)
```
--neutral-0: oklch(0.985 0.012 75);  /* warm paper */
--neutral-1: oklch(0.965 0.014 75);
--neutral-2: oklch(0.940 0.018 75);
--neutral-3: oklch(0.860 0.020 75);
--neutral-8: oklch(0.240 0.020 60);  /* body text */
--neutral-6: oklch(0.520 0.030 75);  /* muted text */
--ink-1:     oklch(0.240 0.020 60);  /* text on bright brand */

--brand-1:  oklch(0.700 0.145 45);   /* soft coral/peach */
--brand-2:  oklch(0.770 0.090 50);   /* brand highlight */
--danger-1: oklch(0.640 0.170 25);
--success-1: oklch(0.700 0.120 145);
--warning-1: oklch(0.820 0.120 75);
```

### 2.2 Primitive Tokens (Dark)
```
--neutral-0: oklch(0.200 0.014 60);  /* warm charcoal */
--neutral-1: oklch(0.235 0.016 60);
--neutral-2: oklch(0.285 0.018 60);
--neutral-3: oklch(0.340 0.020 65);
--neutral-8: oklch(0.950 0.012 80);
--neutral-6: oklch(0.760 0.018 80);
--ink-1:     oklch(0.240 0.020 60);  /* constant ink */

--brand-1:  oklch(0.740 0.155 50);
--brand-2:  oklch(0.820 0.090 55);
--danger-1: oklch(0.700 0.160 25);
--success-1: oklch(0.760 0.110 145);
--warning-1: oklch(0.860 0.110 75);
```

### 2.3 Semantic Tokens (Mapping)
```
--surface-0: var(--neutral-0);  /* app background */
--surface-1: var(--neutral-1);  /* card / panel */
--surface-2: var(--neutral-2);  /* elevated / inset */

--text-1: var(--neutral-8);
--text-2: var(--neutral-6);
--text-3: color-mix(in srgb, var(--text-2) 70%, var(--surface-0));

--stroke-1: var(--neutral-3);
--stroke-2: color-mix(in srgb, var(--stroke-1) 55%, var(--surface-1));

--focus-ring: var(--brand-1);
--scrim: color-mix(in srgb, var(--text-1) 35%, transparent);
--on-brand: var(--ink-1); /* dark theme overrides to light neutral */

--shadow-color: color-mix(in srgb, var(--text-1) 12%, transparent);
--shadow-1: 0 1px 2px var(--shadow-color);
--shadow-2: 0 10px 30px var(--shadow-color);
--shadow-3: 0 18px 40px var(--shadow-color);

--radius-card: 1.25rem;   /* 20px */
--radius-control: 0.75rem;/* aligns with --r-2 */
--radius-pill: 999px;
```

### 2.4 Vibe Tokens (Aurora + Glass)
```
--bg-aurora: layered radial gradients + var(--surface-0);
--glass-bg: color-mix(in srgb, var(--surface-1) 82%, transparent);
--glass-stroke: color-mix(in srgb, var(--stroke-1) 40%, transparent);
--glass-blur: 16px;
--glow-brand: 0 10px 30px color-mix(in srgb, var(--brand-1) 35%, transparent);
```

### 2.5 Compatibility Aliases (Legacy)
```
--bg: var(--surface-0);
--surface: var(--surface-1);
--surface-2: var(--surface-2);
--text: var(--text-1);
--muted: var(--text-2);
--border: var(--stroke-1);
--border-soft: var(--stroke-2);
--ring: var(--focus-ring);
```

## 3) Component Recipes

### 3.1 Button (Canonical)
- Base: `.button`
- Deprecated alias: `.btn` (compat only)
- Variants: `.button--primary`, `.button--secondary`, `.button--ghost`, `.button--danger`
- Sizes: `.button--sm`, `.button--md`, `.button--lg`
- States:
  - Hover: subtle lift or opacity only
  - Active: no layout jump
  - Focus: use `--focus-ring`
  - Disabled: reduced opacity, no pointer events
  - Primary: `--brand-1` background + `--on-brand` text

### 3.2 Segmented Control
- Base: `.segmented`
- Children: `.button` items (active uses `.button--primary`)
- Used for mode toggles

### 3.3 Card
- Base: `.card`
- Sub-elements: `.card__body`, `.card__title`, `.card__meta`
- Uses `--surface-1` with glass tokens when supported

### 3.4 Badge
- Base: `.badge`
- Brand: `.badge--brand` uses soft brand fill + brand text

### 3.5 Input
- Base: `.input`, `.select`, `.textarea`
- Focus ring: `--focus-ring` via box-shadow
- Error state: `--danger-1`

### 3.6 Sheet / Dialog
- `.sheet` wraps `.sheet__panel.dialog`
- Dialog uses `--glass-bg` / `--glass-stroke` with blur when supported
- Sheet backdrop uses `--scrim`

### 3.7 Snackbar
- `.snackbar` uses `--surface-1`, `--shadow-2`, `--stroke-2`

### 3.8 Navigation (Bottom Nav)
- `.bottom-nav` uses glass tokens with `--stroke-2` fallback
- Active state uses `--brand-1`

### 3.9 Header
- `.header-bar` and `.runner-header` use `--glass-bg` + blur when supported

### 3.10 List Surface (Tray)
- Base: `.list-surface`
- Use when a list contains rounded items (cards, list rows, set rows).
- Provides a rounded glass tray background to avoid sharp outer rectangles.

### 3.11 Set Row (Stats Layout)
- Base: `.set-row`
- Stats container: `.set-row__stats`
- Stat pill: `.set-row__stat`
- Value chips: `.set-row__pill`
- Secondary line: `.set-row__sub`
- Reps should sit close to weight, not separated to the far right.

## 4) Rules
- Do not use raw hex colors outside token files.
- Use `.button` as the canonical button API. `.btn` is deprecated and only a compatibility alias.
- Use `--shadow-1/2/3` only; no ad-hoc box-shadows.
- Radii must use `--radius-card`, `--radius-control`, or `--radius-pill`.
- Focus rings must use `--focus-ring` and remain visible.
- Text on brand surfaces must use `--on-brand` (theme-specific).
- Tap targets must respect `--tap` (48px baseline).
- Use `.tabular-nums` for weights, reps, and other numeric metrics.
- Body background uses `--bg-aurora`.
- Glass surfaces use `--glass-*` tokens with `backdrop-filter` guarded by `@supports`.

## 5) Correct Usage Examples

### Button + Badge
```
<button class="button button--primary button--md">Start Workout</button>
<button class="button button--ghost button--md">Cancel</button>
<span class="badge badge--brand">Active</span>
```

### Card + Input
```
<div class="card">
  <div class="card__body">
    <h3 class="card__title">Aurora Glass</h3>
    <p class="card__meta">Glassy surface and gentle borders</p>
    <label class="field">
      <span class="label">Weight</span>
      <input class="input" placeholder="0" />
      <span class="help">Helper text</span>
    </label>
  </div>
</div>
```

### Segmented Control
```
<div class="segmented">
  <button class="button button--primary">Plates</button>
  <button class="button">Total</button>
</div>
```

## 6) Token Preview (Swatches + States)

Swatches (light theme):
```
Surface 0: --surface-0
Surface 1: --surface-1
Surface 2: --surface-2
Text 1:    --text-1
Text 2:    --text-2
Ink:       --ink-1
Stroke 1:  --stroke-1
Brand:     --brand-1
Danger:    --danger-1
```

State examples:
```
Button: normal / hover / active / disabled
Input: normal / focus / error
Badge: normal / brand
Card: default / elevated
```
