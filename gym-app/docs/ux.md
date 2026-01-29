## Section A: Core UX Principles

### A1. Speed beats spectacle (especially between sets)

* **Rule:** Default to “blink-fast clarity”: animations must **never delay logging a set**.
* **Why it matters:** In a gym, users are time-slicing attention. Motion should confirm actions, not become a mini cutscene.
* **Correct implementation:** Keep frequent microinteractions short; reserve longer transitions for infrequent navigations. Material guidance: mobile transitions ~300ms, entering ~225ms, leaving ~195ms; avoid >400ms. ([Material Design][1])
* **Avoid:** Slow, unskippable animations that block taps or make the UI feel “laggy”. ([Material Design][1])

### A2. Continuity over confusion

* **Rule:** Use motion to show **where things went** (relationship), not just that “something happened.”
* **Why it matters:** Navigation in a stats-heavy app can disorient. Well-chosen transitions preserve context (day → workout → set → history).
* **Correct implementation:** Use shared-element transitions (e.g., selected day tile morphs into the workout header) when it genuinely aids comprehension. View Transitions are designed for this kind of continuity in SPA/MPA flows. ([MDN Web Docs][2])
* **Avoid:** Animating everything. Over-animation becomes noise, and can trigger dizziness for some users. ([Nielsen Norman Group][3])

### A3. Motion must be safe-by-default

* **Rule:** Every non-essential motion effect must respect reduced-motion preferences.
* **Why it matters:** Motion sensitivity is real; WCAG explicitly addresses animation and user control. ([W3C][4])
* **Correct implementation:** Provide reduced-motion mode via `prefers-reduced-motion` and ensure the UI still communicates state changes. ([web.dev][5])
* **Avoid:** “Motion-only” feedback (e.g., success only shown via a bounce).

### A4. Touch-first ergonomics

* **Rule:** Interactive targets must be large and spaced for sweaty thumbs.
* **Why it matters:** Small tap targets cause mis-taps and frustration mid-set.
* **Correct implementation:** Minimum recommended target size ~48dp and spacing around ~8dp are common guidance. ([web.dev][6])
* **Avoid:** Icon-only buttons without padding.

---

## Section B: CSS Architecture Rules

### B1. Token-first styling using CSS custom properties

* **Rule:** All spacing, typography, color, radius, shadows, and motion constants must come from tokens.
* **Why it matters:** Tokens make the system consistent and easy to evolve. CSS custom properties exist specifically for reusable values. ([MDN Web Docs][7])
* **Correct implementation:** Define tokens in `:root`, override in `[data-theme="dark"]`.
* **Avoid:** Hard-coded values scattered across components.

### B2. Component boundaries with container queries, not viewport guessing

* **Rule:** Use **container queries** for component responsiveness (cards, stat tiles, bottom sheets), and media queries for “layout mode” changes.
* **Why it matters:** Container queries adapt components based on their container, improving composability. ([MDN Web Docs][8])
* **Correct implementation:** Set `container-type` on component wrappers, use `@container` for variations. ([MDN Web Docs][9])
* **Avoid:** Components that only work at specific viewport breakpoints.

### B3. Fluid sizing for mobile: `clamp()` as the default

* **Rule:** Use `clamp()` for fluid typography and spacing ramps.
* **Why it matters:** It keeps text and spacing comfortable across device sizes without breakpoint spam. ([MDN Web Docs][10])
* **Correct implementation:** `font-size: clamp(min, preferred, max)`. ([MDN Web Docs][10])
* **Avoid:** Dozens of one-off font sizes per breakpoint.

### B4. CSS file structure (simple, strict)

* **Rule:** Use a layered structure so overrides are predictable.
* **Why it matters:** Predictability is how you avoid “why is this margin winning?”
* **Correct implementation (recommended):**

  * `tokens.css` (only variables)
  * `base.css` (reset, typography, global elements)
  * `layout.css` (app shell, grids)
  * `components/*.css` (component styles)
  * `motion.css` (animations, view-transition pseudo-element rules)
* **Avoid:** One mega-file with interleaved concerns.

### B5. Focus styles must use `:focus-visible`

* **Rule:** Customize focus with `:focus-visible`, not `:focus`.
* **Why it matters:** `:focus-visible` matches when users actually need a focus indicator (keyboard-like interaction), reducing visual noise while staying accessible. ([MDN Web Docs][11])
* **Correct implementation:** Strong, high-contrast outline/ring on `:focus-visible`.
* **Avoid:** Removing focus rings globally.

---

## Section C: View Transition Standards

### C1. Progressive enhancement only

* **Rule:** View transitions must be optional and never required for correctness.
* **Why it matters:** `@view-transition` is limited-availability and support varies. ([MDN Web Docs][12])
* **Correct implementation:** Feature-detect `document.startViewTransition` for SPA transitions; use normal DOM updates otherwise. ([Chrome for Developers][13])
* **Avoid:** Code that breaks navigation when the API is missing.

### C2. SPA transitions: wrap DOM updates with `document.startViewTransition`

* **Rule:** Every SPA route/content swap that benefits from continuity must be wrapped.
* **Why it matters:** This is the intended mechanism for same-document transitions. ([MDN Web Docs][14])
* **Correct implementation:** Use a single helper that:

  1. detects support
  2. starts transition
  3. updates DOM in callback
  4. optionally waits for `transition.finished` for cleanup. ([MDN Web Docs][15])
* **Avoid:** Starting transitions after DOM updates (too late).

### C3. Cross-document (MPA) transitions: opt-in via `@view-transition`

* **Rule:** If you have multi-page navigation, opt in via CSS on both pages.
* **Why it matters:** Cross-document transitions require same-origin pages and explicit opt-in. ([MDN Web Docs][12])
* **Correct implementation:**

  * `@view-transition { navigation: auto; }` on both pages. ([MDN Web Docs][12])
* **Avoid:** Expecting transitions across different origins or redirect chains. ([MDN Web Docs][12])

### C4. Shared element transitions must have unique `view-transition-name`

* **Rule:** Never duplicate `view-transition-name` among simultaneously rendered elements.
* **Why it matters:** If duplicates exist, `ViewTransition.ready` can reject and the transition is skipped. ([MDN Web Docs][16])
* **Correct implementation:** Use deterministic naming (e.g., `day-2026-01-28`) or `match-element` for lists in same-document transitions. ([MDN Web Docs][16])
* **Avoid:** Assigning the same name to every card title.

### C5. When NOT to use view transitions

* **Rule:** Do not animate transitions for:

  * error states
  * validation failures
  * extremely frequent state toggles (set +1, rep edit)
* **Why it matters:** Users need immediate feedback, not theatrical continuity. Also reduces motion fatigue.
* **Correct implementation:** Use microfeedback (color, subtle scale, haptics-like timing) without page-level transitions.
* **Avoid:** Big cross-fades on every checkbox.

---

## Section D: Animation System Rules

### D1. Only animate composite-friendly properties by default

* **Rule:** Prefer `transform` and `opacity`; treat everything else as “needs justification.”
* **Why it matters:** These typically stay in the compositor and avoid costly layout/paint. ([web.dev][17])
* **Correct implementation:** Slide with `translate`, fade with `opacity`, scale with `transform: scale()`. ([web.dev][17])
* **Avoid:** Animating `top/left/width/height` for movement/resizing when a transform would work. ([web.dev][17])

### D2. Timing and easing: one system, not vibes

* **Rule:** Use a small set of standard durations and easing curves.
* **Why it matters:** Consistent motion “feels” professional and reduces cognitive load.
* **Correct implementation:** Adopt Material’s well-known cubic-bezier curves and mobile duration ranges. ([Material Design][1])
* **Avoid:** Random easings per component.

### D3. Recommended durations + easing (mobile gym app defaults)

| Use case                               |     Duration | Easing       | Notes                                                     |
| -------------------------------------- | -----------: | ------------ | --------------------------------------------------------- |
| Tap feedback (press)                   |     90–120ms | standard     | instant confirmation                                      |
| Quick state change (toggle, chip)      |    150–200ms | standard     | frequent actions                                          |
| Element enter                          |       ~225ms | deceleration | matches “entering screen” guidance ([Material Design][1]) |
| Element exit                           |       ~195ms | acceleration | matches “leaving screen” guidance ([Material Design][1])  |
| Full-screen transition (day → workout) |       ~300ms | standard     | typical mobile transitions ([Material Design][1])         |
| Large/complex full-screen              | up to ~375ms | standard     | never exceed ~400ms ([Material Design][1])                |

**Easing curves (CSS):**

* **standard:** `cubic-bezier(0.4, 0.0, 0.2, 1)` ([Material Design][1])
* **deceleration (enter):** `cubic-bezier(0.0, 0.0, 0.2, 1)` ([Material Design][1])
* **acceleration (exit):** `cubic-bezier(0.4, 0.0, 1, 1)` ([Material Design][1])
* **sharp (rare, “snap away”):** `cubic-bezier(0.4, 0.0, 0.6, 1)` ([Material Design][1])

### D4. Gym-specific motion patterns

#### Logging a workout (between sets)

* **Rule:** Confirm instantly, celebrate softly.
* **Why it matters:** Users need confidence with minimal distraction.
* **Correct implementation:** On “Log set”:

  * button press: 100ms scale down/up
  * row update: 150–200ms fade/slide-in for new set line
* **Avoid:** Full-screen celebrations or long progress animations.

#### Viewing stats

* **Rule:** Animate in “layers of meaning.”
* **Why it matters:** Stats screens can be visually dense.
* **Correct implementation:** Stagger small groups (header → chart → insights) with 50–80ms delays, each using 225ms deceleration.
* **Avoid:** Everything animating simultaneously.

#### Progress feedback (rings, streaks)

* **Rule:** Progress should “fill” smoothly, not whip around.
* **Why it matters:** Smooth progress reads as calm and motivating.
* **Correct implementation:** 600–900ms fill for infrequent events (workout complete), but obey reduced-motion and allow skip.
* **Avoid:** Fast spinning arcs or big zooms.

---

## Section E: Accessibility + Motion Safety

### E1. Respect reduced-motion everywhere

* **Rule:** If `prefers-reduced-motion: reduce` is set, remove non-essential animations and transitions.
* **Why it matters:** This preference exists specifically to minimize animation/motion. ([web.dev][5])
* **Correct implementation:** Provide a CSS gate and a JS gate for WAAPI/view transitions.
* **Avoid:** Only reducing some animations (users notice the “forgotten” ones).

### E2. Provide user control for problematic motion

* **Rule:** Non-essential motion triggered by interaction should be disable-able (aligns with WCAG “animation from interactions”). ([W3C][4])
* **Why it matters:** Some users get dizzy or nauseated from interaction-triggered motion. ([Nielsen Norman Group][3])
* **Correct implementation:** Add an in-app “Reduce motion” toggle that forces reduced mode even if OS does not.
* **Avoid:** Relying only on OS settings for compliance-sensitive contexts.

### E3. Avoid auto-moving content without pause/stop

* **Rule:** No auto-updating/moving UI that lasts >5 seconds without a mechanism to pause/stop/hide. ([W3C][18])
* **Why it matters:** This is a classic accessibility failure mode (tickers, endlessly animating banners).
* **Correct implementation:** If you have live counters or rotating tips, keep them static by default or provide controls.
* **Avoid:** Infinite “motivational quote carousel” that animates forever.

### E4. Focus visibility and keyboard safety

* **Rule:** All interactive elements must have visible `:focus-visible` styling.
* **Why it matters:** Keyboard users (and some assistive tech flows) rely on focus indicators. ([MDN Web Docs][11])
* **Correct implementation:** High-contrast ring, not clipped by overflow.
* **Avoid:** Focus outlines removed.

### E5. Touch targets

* **Rule:** Minimum tap target ~48dp and spacing ~8dp.
* **Why it matters:** Prevents fat-finger errors. ([web.dev][6])
* **Correct implementation:** Add padding even when the icon stays 24px.
* **Avoid:** Tiny icons as the only hit area.

---

## Section F: Performance Budget Rules

### F1. No layout thrashing in animated flows

* **Rule:** In animation code, batch reads then writes; never interleave.
* **Why it matters:** Forced synchronous layout and layout thrashing kill smoothness. ([web.dev][19])
* **Correct implementation:** Measure once, then apply classes/variables.
* **Avoid:** Reading layout (`getBoundingClientRect`) after writing styles in the same frame loop.

### F2. Composite-only animation as default

* **Rule:** Use compositor-friendly properties for almost all motion.
* **Why it matters:** Avoids layout/paint and reduces jank. ([web.dev][17])
* **Correct implementation:** `transform`, `opacity`; optionally `will-change` only when profiling proves benefit. ([web.dev][17])
* **Avoid:** Blanket `will-change` everywhere (memory and layer bloat). ([web.dev][17])

### F3. Render less: containment + content-visibility for heavy screens

* **Rule:** Use `content-visibility: auto` for long stats/history lists and isolate subtrees with `contain` where safe.
* **Why it matters:** Skips offscreen rendering work and improves initial and interaction performance. ([web.dev][20])
* **Correct implementation:** Apply to chunked list sections; test accessibility implications.
* **Avoid:** Applying containment blindly to complex layouts without verifying overflow/positioning behavior. ([MDN Web Docs][21])

### F4. Motion budget for low-end phones

* **Rule:** On low-end devices, reduce concurrent animations and prefer fades over large translations.
* **Why it matters:** Main thread contention interrupts even compositor animations. ([web.dev][22])
* **Correct implementation:** Gate optional flourishes behind a “delight budget” flag; keep core feedback intact.
* **Avoid:** Multiple simultaneous shadows/blur animations (paint-heavy).

---

## Section G: Implementation Checklist

### Must-haves (agent must not skip)

* Tokens defined via CSS custom properties and used everywhere. ([MDN Web Docs][23])
* Container queries used for component responsiveness where appropriate. ([MDN Web Docs][8])
* `prefers-reduced-motion` respected in CSS and JS. ([web.dev][5])
* Focus styles implemented with `:focus-visible`. ([MDN Web Docs][11])
* Tap targets meet ~48dp guidance. ([web.dev][6])
* Animations default to `transform` and `opacity`. ([web.dev][17])
* View transitions are progressive-enhancement only, with fallback. ([Chrome for Developers][13])

### Definition of done (per feature)

* No animation blocks user input.
* Reduced-motion mode looks intentional (not “broken”).
* Performance profiling shows no layout thrashing on key flows. ([web.dev][19])
* Shared element transitions never duplicate `view-transition-name`. ([MDN Web Docs][16])

---

## Section H: Code Pattern Examples

### H1. Design token system (gym app starter)

```css
/* tokens.css */
:root {
  /* Typography */
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  --text-xs: clamp(0.75rem, 0.72rem + 0.2vw, 0.8125rem);
  --text-sm: clamp(0.875rem, 0.84rem + 0.2vw, 0.9375rem);
  --text-md: clamp(1rem, 0.96rem + 0.25vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1.05rem + 0.5vw, 1.375rem);
  --text-xl: clamp(1.375rem, 1.2rem + 0.9vw, 1.875rem);

  /* Spacing (4-based, with a little fluidity) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;

  /* Radius */
  --r-sm: 0.5rem;
  --r-md: 0.75rem;
  --r-lg: 1rem;
  --r-xl: 1.25rem;

  /* Color (starter palette - tune later) */
  --bg: #0b0f14;
  --surface: #121926;
  --surface-2: #182235;
  --text: #e8eef6;
  --muted: #a9b4c4;

  --primary: #4ade80;   /* “progress green” */
  --primary-2: #22c55e;
  --danger: #fb7185;
  --warning: #fbbf24;

  /* Shadows (keep subtle on OLED) */
  --shadow-1: 0 1px 2px rgba(0,0,0,0.35);
  --shadow-2: 0 8px 20px rgba(0,0,0,0.35);

  /* Motion durations (from Material guidance ranges) */
  --dur-press: 120ms;
  --dur-fast: 180ms;
  --dur-enter: 225ms;
  --dur-exit: 195ms;
  --dur-page: 300ms;
  --dur-page-lg: 375ms;

  /* Easing (Material curves) */
  --ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
  --ease-decel: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-accel: cubic-bezier(0.4, 0.0, 1, 1);
  --ease-sharp: cubic-bezier(0.4, 0.0, 0.6, 1);

  /* Tap target */
  --tap: 48px;
}

/* Optional light theme */
[data-theme="light"] {
  --bg: #f7fafc;
  --surface: #ffffff;
  --surface-2: #f1f5f9;
  --text: #0b1220;
  --muted: #475569;
}
```

Why these choices:

* Tokens via CSS variables are the standard mechanism. ([MDN Web Docs][7])
* `clamp()` is built for fluid ranges. ([MDN Web Docs][10])
* Durations/easings match Material’s documented curves and mobile timing ranges. ([Material Design][1])

---

### H2. Animation + transition spec sheet (starter)

```css
/* motion.css */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}

.btn {
  min-inline-size: var(--tap);
  min-block-size: var(--tap);
  padding: 0 var(--space-4);
  border-radius: var(--r-md);
  transition: transform var(--dur-press) var(--ease-standard),
              opacity var(--dur-fast) var(--ease-standard);
}

.btn:active {
  transform: scale(0.98);
}
```

Reduced-motion guidance comes straight from the `prefers-reduced-motion` pattern. ([web.dev][5])
Tap target guidance aligns with 48dp recommendations. ([web.dev][6])

---

### H3. Starter View Transition boilerplate (SPA)

```js
// viewTransitions.js
export function withViewTransition(updateDomFn, { types = [] } = {}) {
  // Progressive enhancement
  if (!document.startViewTransition) {
    updateDomFn();
    return Promise.resolve();
  }

  const vt = document.startViewTransition(() => {
    updateDomFn();
  });

  // Optional: tag transition types for CSS targeting if you use them
  try {
    types.forEach(t => vt.types?.add?.(t));
  } catch {}

  return vt.finished;
}
```

This matches the core triggering model for same-document transitions. ([MDN Web Docs][14])

---

### H4. Starter View Transition boilerplate (MPA)

```css
/* On BOTH pages (same-origin) */
@view-transition {
  navigation: auto;
}

/* Simple vertical slide */
::view-transition-old(root) {
  animation: var(--dur-page) var(--ease-accel) both vt-out;
}

::view-transition-new(root) {
  animation: var(--dur-page) var(--ease-decel) both vt-in;
}

@keyframes vt-out { to { transform: translateY(-8%); opacity: 0; } }
@keyframes vt-in  { from { transform: translateY(8%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
```

Cross-document opt-in and `navigation: auto` are explicitly required. ([MDN Web Docs][12])

---

### H5. Shared element transition example (day tile → header)

```css
/* Day tile in calendar list */
.day-tile[data-day="2026-01-28"] {
  view-transition-name: day-2026-01-28;
}

/* Workout header on the destination view */
.workout-header[data-day="2026-01-28"] {
  view-transition-name: day-2026-01-28;
}

/* Optional polish */
::view-transition-old(day-2026-01-28),
::view-transition-new(day-2026-01-28) {
  border-radius: var(--r-lg);
}
```

Rules about `view-transition-name`, pseudo-elements, and uniqueness come directly from MDN. ([MDN Web Docs][16])

---

### H6. Progress ring animation (SVG, composite-friendly)

```html
<svg class="ring" viewBox="0 0 120 120" aria-label="Weekly progress">
  <circle class="ring__track" cx="60" cy="60" r="48" />
  <circle class="ring__bar" cx="60" cy="60" r="48" />
</svg>
```

```css
.ring { width: 120px; height: 120px; }
.ring__track {
  fill: none;
  stroke: rgba(255,255,255,0.12);
  stroke-width: 12;
}
.ring__bar {
  fill: none;
  stroke: var(--primary);
  stroke-width: 12;
  stroke-linecap: round;

  /* circumference = 2πr ≈ 301.6 */
  stroke-dasharray: 302;
  stroke-dashoffset: calc(302 * (1 - var(--p, 0)));

  transition: stroke-dashoffset 700ms var(--ease-standard);
}

@media (prefers-reduced-motion: reduce) {
  .ring__bar { transition: none; }
}
```

If you need extra performance for large lists of these, isolate and skip offscreen rendering with `content-visibility` on the list container. ([web.dev][20])

---

## Do / Don’t Checklist (implementation agents)

**Do**

* Use tokens everywhere (CSS variables). ([MDN Web Docs][23])
* Use container queries for component adaptability. ([MDN Web Docs][8])
* Use `transform` and `opacity` for motion; profile before using `will-change`. ([web.dev][17])
* Wrap SPA route swaps in `document.startViewTransition` with fallback. ([Chrome for Developers][13])
* Ensure unique `view-transition-name` values. ([MDN Web Docs][16])
* Respect `prefers-reduced-motion` and offer an in-app toggle. ([web.dev][5])
* Keep tap targets at least ~48dp. ([web.dev][6])

**Don’t**

* Don’t animate layout properties unless unavoidable. ([web.dev][17])
* Don’t use view transitions for high-frequency micro-actions.
* Don’t create auto-moving UI without user control. ([W3C][18])
* Don’t remove focus indicators; use `:focus-visible`. ([MDN Web Docs][11])
