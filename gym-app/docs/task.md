You are a senior product engineer + motion-focused mobile UX implementer.

Build a **mobile-first offline Next.js PWA gym tracker** whose primary experience is a **Workout Runner feed** (like Instagram scroll, but for lifting). It must feel as polished as modern apps (ChatGPT, Spotify, Instagram, Telegram) in these ways:

* instant feedback
* smooth transitions
* clean hierarchy
* predictable gestures
* minimal typing
* “one-handed, sweaty-thumb” ergonomics

This is not a generic CRUD app. Implement the **full wireframe UI + motion system** exactly.

---

# 0) Hard Requirements (Non-negotiable)

### Tech

* Next.js App Router
* TypeScript
* Zustand
* IndexedDB persistence (OK to stub with a small wrapper, but must be real calls)
* PWA-ready structure (app shell works offline)
* NO login, NO backend, NO timers

### Styling

* **You must use the provided `globals.css` exactly as the baseline design system.**
* You must style primarily using the classes defined there: `.container`, `.stack`, `.cluster`, `.card`, `.btn`, `.badge`, `.input`, `.dialog`, utilities like `.muted`, `.truncate`, `.shadow-1`, etc.
* You may add minimal component-specific classes only in a single `app/ui.css` or `components.css` layer, but:

  * Must respect cascade layers (use `@layer components` or `@layer overrides`)
  * Must use existing CSS variables (`--space-*`, `--dur-*`, `--ease-*`, colors)
* Do NOT rely on Tailwind utility styling as the primary system. (Tailwind can exist, but your UI must look correct using `globals.css` tokens and component classes.)

### Accessibility + UX

* Tap targets ≥ 48px
* Visible focus states (do not remove)
* `prefers-reduced-motion` must be respected (animations reduce or collapse to instant)
* No “are you sure?” dialogs for trivial actions; use Undo snackbars
* Never block interaction with janky keyboard behavior; bottom sheets must remain usable

---

# 1) App Information (Domain Rules)

Entities stored locally:

* exercises: `{id, name, type, defaultInputMode}`
* programs: `{id, name, note?, exerciseIds[]}`
* workouts: `{id, programId, startedAt, endedAt?, entries[]}`
* settings: `{unitsPreference, defaultBarWeight}`

Key product rule:

* Programs define **exercise order only**, no fixed sets.
* When starting Program X, prefill **Suggested sets** from the most recent completed workout of Program X, per exercise, in the same order.
* Logging UX must be “tap, done, next”, minimal typing.

Weight rule:

* Store canonical weight as **total kg**.
* Display:

  * kg prominent
  * lb secondary
  * if barbell plates-per-side mode: show per-side context and computed total.

---

# 2) Screen Map (Routes required)

Bottom navigation tabs (fixed, always reachable):

1. Today `/`
2. Programs `/programs`
3. History `/history`
4. Settings `/settings`

Additional routes:

* Workout Runner `/workout/[workoutId]`
* Program Detail `/programs/[programId]`
* Workout Detail `/history/[workoutId]`

All screens must be real routes using App Router.

---

# 3) Motion System (Enforced)

## 3.1 View Transitions API (progressive enhancement)

You MUST implement View Transitions for route navigation and key UI state changes.

* Use `document.startViewTransition()` when supported.
* Use your `globals.css` enhancement hooks: `.vt-hero { view-transition-name: hero; }` for shared elements.
* Provide fallback transitions when View Transitions is not supported:

  * simple CSS fade/slide using `--dur-*` and `--ease-*`.
* Respect reduced motion:

  * if `prefers-reduced-motion: reduce`, disable view transitions and use instant state changes.

### Required shared element transitions:

* Tapping a Program Card on Today → Workout Runner:

  * Program card becomes the runner header “hero” (shared transition)
* Tapping a Workout in History list → Workout Detail:

  * Row expands into header block

## 3.2 Micro-interactions (must implement)

These are required and must feel “premium”:

* Set completion:

  * on tap: quick “confirm pulse” (scale 0.98→1, opacity shift, check icon appears)
  * haptic-like feel (visual only; vibration optional if available)
* Bottom sheet open:

  * slides up, slight backdrop fade, snap easing using `--ease-2`
* Bottom sheet close:

  * reverses smoothly
* Snackbar Undo:

  * slides up above bottom nav, auto dismiss

Do NOT over-animate. Motion must clarify state.

---

# 4) Screen-by-Screen Implementation Requirements

## 4.1 Today `/`

Purpose: start or resume instantly.

Layout:

* Header “Today”
* Program cards list (use `.card`)
* If an active workout exists: show a sticky “Resume Workout” card at top (always visible)

Interactions:

* Tap Program card:

  * creates a new workout (in-progress)
  * navigates to Workout Runner
  * uses view transition (shared element)
* Tap Resume:

  * navigates to existing runner (view transition)

## 4.2 Workout Runner `/workout/[workoutId]` (Most important)

This is the “feed”.

Layout rules:

* Sticky top bar:

  * Program name
  * Finish button
* Scrollable feed of Exercise Cards (`.card`)
* Each Exercise Card:

  * Header: exercise name + type badge
  * Suggested section (if exists): label “Suggested” as `.badge`
  * Set list: each set is a tappable “chip row”
  * Add Set button: duplicates last set instantly

Set row UI:

* Large kg value
* Small lb value under/next to it
* Reps value
* Completion indicator

Behavior:

* Tap set row:

  * toggles complete
  * triggers completion micro-animation
  * next incomplete set gets a subtle highlight ring
* Tap weight or reps:

  * opens Edit Set bottom sheet (no route change)
* Delete set:

  * allowed via swipe action or small “…” menu
  * uses Undo snackbar (no confirm dialog)
* Autosave after every interaction to IndexedDB (no explicit save button)

## 4.3 Edit Set Bottom Sheet (component, not a route)

Must be a real bottom sheet:

* backdrop
* focus trap
* escape to close
* drag-to-close optional (Tier B), but ensure it doesn’t break scrolling

Contents:

* Weight editor:

  * stepper buttons + numeric input (`.input`)
  * unit display
* Reps editor:

  * stepper + numeric input
* Mode toggle if barbell:

  * plates-per-side vs total
* Actions:

  * Save (primary `.btn--primary`)
  * Cancel (`.btn--ghost`)

Keyboard handling:

* Inputs must remain visible when keyboard opens (use `scrollIntoView` or padding strategy).

## 4.4 Finish Workout Flow

Tap “Finish” in runner:

* opens confirmation **sheet** (not alert):

  * “End workout?”
  * Cancel / Finish
* Finish:

  * marks workout ended
  * navigates to Summary screen route (or inline page section)
  * uses view transition

## 4.5 Summary (Workout Complete)

Route can be `/workout/[workoutId]/summary` or `/summary/[workoutId]` (choose one, be consistent).

Layout:

* Title: “Workout Complete”
* Stats:

  * exercises completed
  * total sets
  * total volume kg primary
* Primary button: Done → Today

Motion:

* stats float-in (small translateY + fade) if not reduced motion.

## 4.6 Programs `/programs` + `/programs/[programId]`

Programs list:

* `.card` rows with name + edit affordance
* FAB “New Program” (fixed above bottom nav)

Program detail:

* Name + note fields
* Ordered exercise list:

  * Each row has drag handle
  * Must support reorder
  * Must have accessible fallback reorder buttons (Up/Down)
* Add Exercise opens search sheet
* Search sheet:

  * search input
  * results list
  * “Create new exercise” action

## 4.7 History `/history` + `/history/[workoutId]`

History list:

* grouped by date
* each row shows program name, date, total volume
* tapping row uses view transition into detail

Detail:

* read-only “journal page”
* exercise order + sets
* total volume summary

## 4.8 Settings `/settings`

Must implement:

* Units preference (but kg always visible)
* Default bar weight
* Export JSON (download file)
* Import JSON (upload file, replace all data for MVP)
* Reset all data (danger zone) with confirmation sheet

---

# 5) Implementation Architecture (Required)

## 5.1 Components

Implement these reusable components:

* `<BottomNav />`
* `<ProgramCard />`
* `<ExerciseCard />`
* `<SetRow />` (or SetChip)
* `<BottomSheet />` (generic, reusable)
* `<EditSetSheet />`
* `<ConfirmSheet />`
* `<Snackbar />` with Undo
* `<HeaderBar />`

## 5.2 State + Persistence

* Zustand store modules:

  * programs
  * exercises
  * workouts (active + history)
  * settings
  * UI (bottom sheet state, snackbar)
* IndexedDB wrapper:

  * `getAll`, `getById`, `put`, `delete`, `exportJSON`, `importJSON`
* Autosave pattern:

  * interactions update Zustand first
  * then persist to IndexedDB (debounced lightly, but must be reliable)

---

# 6) Navigation + Performance Rules

* Bottom nav must not re-mount everything unnecessarily.
* Lists should use `.virtual-list` class for `content-visibility: auto`.
* Avoid heavy libraries.
* Keep interaction latency low: taps should respond instantly (even if persistence happens right after).

---

# 7) “Premium App Feel” Checklist (Must pass)

* Route transitions feel smooth (View Transitions when possible)
* Bottom sheet feels native: backdrop, snap easing, no layout jumps
* Set logging is fast: tap completes with satisfying animation
* No accidental data loss: resume workout always works
* Undo exists for destructive actions
* Reduced motion users are respected

---

# 8) Output Requirements

Return:

* Complete Next.js project structure (App Router)
* All routes implemented
* globals.css imported and used as primary styling system
* Motion system implemented with progressive enhancement
* Wireframe is functional end-to-end:

  * create program
  * start workout
  * suggested sets appear on rerun
  * log sets
  * finish workout
  * view history
  * export/import/reset

Do NOT produce pseudocode. Produce working code.

---

## End of prompt.