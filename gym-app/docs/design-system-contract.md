# Design System Contract — Mango Voltage Liquid Glass (Gym App)

This contract defines the **visual system** for the app. It is the source of truth for tokens, component recipes, and allowed patterns. No business logic is implied.

## 1) Design Intent
- Aurora gradient background is the “world.”
- Surfaces are **dark translucent glass** with specular highlight + subtle noise.
- Warm accents (mango/coral) are **signal/light**, not large paint fills.
- Cool accents drive **focus + selection**.
- One coherent component family: shared radii, shadows, focus, spacing.
- Token-first + accessible: visible focus ring, 48px tap targets, reduced-motion safe.

## 2) Tokens (Dark-First)

### 2.1 Brand Palette
```
--hot-1: #FFB300;  /* mango gold */
--hot-2: #FF4D6D;  /* coral heat */
--cool-1: #3D7BFF; /* arctic blue */
--cool-2: #42FFD2; /* mint glow */
```

### 2.2 Neutrals + Surfaces
```
--neutral-0: oklch(0.10 0.035 260); /* base */
--neutral-1: oklch(0.14 0.040 260);
--neutral-2: oklch(0.18 0.045 260);
--neutral-3: oklch(0.24 0.050 260);

--surface-0: var(--neutral-0);
--surface-1: color-mix(in srgb, var(--neutral-1) 82%, transparent);
--surface-2: color-mix(in srgb, var(--neutral-2) 78%, transparent);
--surface-3: color-mix(in srgb, var(--neutral-2) 88%, transparent);

--surface-highlight: color-mix(in srgb, white 14%, transparent);
--surface-noise: repeating-linear-gradient(0deg, color-mix(in srgb, white 3%, transparent) 0px, transparent 2px, transparent 4px);
```

### 2.3 Text + Focus
```
--text-1: color-mix(in srgb, white 92%, var(--cool-1) 8%);
--text-2: color-mix(in srgb, white 70%, var(--cool-1) 10%);
--text-3: color-mix(in srgb, var(--text-2) 80%, var(--surface-0));
--placeholder: color-mix(in srgb, var(--text-2) 75%, var(--surface-0));
--text-shadow: 0 2px 12px color-mix(in srgb, black 55%, transparent);

--focus-ring: color-mix(in srgb, var(--cool-1) 70%, var(--cool-2));
```

### 2.4 Glass + Elevation
```
--stroke-inner: color-mix(in srgb, white 12%, transparent);
--stroke-outer: color-mix(in srgb, white 20%, transparent);

--shadow-1: 0 1px 2px color-mix(in srgb, black 66%, transparent);
--shadow-2: 0 16px 50px color-mix(in srgb, black 66%, transparent);
--shadow-3: 0 28px 90px color-mix(in srgb, black 66%, transparent);

--glow-hot:  0 18px 50px color-mix(in srgb, var(--hot-1) 35%, transparent);
--glow-cool: 0 18px 50px color-mix(in srgb, var(--cool-1) 35%, transparent);

--bg-aurora: layered radial gradients + var(--surface-0);
```

## 3) Component Recipes (Canonical)

### 3.1 Buttons
- Base: `.button` (alias `.btn`)
- Variants: `.button--primary`, `.button--secondary`, `.button--ghost`, `.button--danger`
- Sizes: `.button--sm`, `.button--md`, `.button--lg` (min height 48px)
- Primary: glass + **hot glow**, not a solid color slab

### 3.2 Icon Buttons
- Base: `.icon-button` (used with `.button`)
- Must meet 48px hit area

### 3.3 Chips + Pills
- Chip: `.chip`, active `.chip--active`
- Pill: `.pill`, strong `.pill--strong`
- Pill structure:
```
<span class="pill pill--strong">
  <span class="pill__label">kg</span>
  <span class="pill__value">60</span>
</span>
```

### 3.4 Card
- Base: `.card`
- Sub-elements: `.card__body`, `.card__title`, `.card__meta`
- Uses `--surface-1` with specular highlight + noise

### 3.5 Input
- Base: `.input`, `.select`, `.textarea`
- Placeholder: `--placeholder` with opacity 1
- Focus: `--focus-ring`

### 3.6 Sheet / Dialog
- `.sheet` wraps `.sheet__panel`
- Panel uses `--surface-3`, strong blur when supported
- Backdrop uses `--scrim`

### 3.7 Snackbar
- `.snackbar` uses `--surface-3` + `--shadow-2`

### 3.8 Navigation
- `.bottom-nav` uses `--surface-3`
- Active indicator uses cool glow (not overpowering)

### 3.9 Header
- `.header-bar` / `.runner-header` use `--surface-3`

### 3.10 List Surface (Tray)
- `.list-surface` uses `--surface-2` and holds list rows/cards

### 3.11 Set Row (Stats Layout)
- Base: `.set-row`
- Stats: `.set-row__values` contains `.pill` elements
- Actions: `.set-row__actions` contains reps + delete icon button
- Reps should sit near weight, not detached to the far right

## 4) Rules
- No raw hex colors outside token files.
- Use `.button` as the canonical button API.
- Use `--surface-1/2/3` for all surfaces.
- Use `--focus-ring` for focus-visible (do not remove without replacement).
- Tap targets must be >= 48px.
- Avoid nested gradients inside surfaces.
