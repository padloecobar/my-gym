# Combined AI Agent Instructions

## Mobile-first gym progress tracking app with Modern CSS + View Transitions + React 19 + Zustand 5

These instructions merge your existing engineering standards with the new UX/motion playbook. When rules collide, the tie-breaker is: **speed, clarity, accessibility, and predictable architecture**.

---

## 0) Non-negotiables

1. **Speed beats spectacle**

   * Logging a set must feel instant. Motion must never delay taps or block input.
   * Use longer transitions only for infrequent navigations (day → workout → history).

2. **Progressive enhancement**

   * View Transitions are optional. The app must be fully correct without them.

3. **Motion safety**

   * Respect `prefers-reduced-motion` everywhere.
   * Also provide an in-app “Reduce motion” toggle that forces reduced motion even if OS does not.

4. **Touch-first ergonomics**

   * All interactive elements meet a minimum tap target of ~48px, with comfortable spacing.

5. **Predictable CSS**

   * Tokens + cascade layers + container queries + low specificity. No “CSS cage matches”.

6. **State discipline**

   * Zustand is for shared state that truly needs to be shared.
   * Server data caching belongs in a real caching strategy (or framework cache), not in ad hoc global store.

---

## 1) UX and Motion System

### 1.1 Motion intent rules

* Motion must convey **relationship** (“where it went”), not decoration.
* Avoid big transitions for:

  * validation errors
  * failures
  * ultra-frequent actions (rep edits, +1 set, checkbox spam)

### 1.2 Duration and easing contract (mobile gym defaults)

Use a small, consistent set (tokens). Recommended:

* Press feedback: **90–120ms**
* Quick state change: **150–200ms**
* Enter: **~225ms**
* Exit: **~195ms**
* Full-screen navigation: **~300ms**
* Large full-screen: **up to ~375ms**
* Hard cap: **never exceed ~400ms** unless explicitly justified and skippable

Easing set:

* standard, decel (enter), accel (exit), sharp (rare)

### 1.3 Gym-specific interaction patterns

* **Log set (between sets):**

  * press: quick scale (100–120ms)
  * row update: subtle fade/slide (150–200ms)
  * never do page-level view transitions for this
* **Stats screens:**

  * animate in meaning layers (header → chart → insights) with light stagger
* **Progress fill (workout complete):**

  * 600–900ms is allowed only for infrequent “completion moments”
  * must respect reduced motion and allow skip (or keep it purely decorative)

### 1.4 Motion gating (must implement)

Define a single “motion mode” source of truth:

* `motionMode = reduced` if:

  * OS prefers reduced motion, OR
  * user toggled Reduce Motion ON in app
* Otherwise `motionMode = full`

CSS must gate via media query and a root attribute/class override:

* OS: `@media (prefers-reduced-motion: reduce)`
* App override: `[data-motion="reduced"]`

JS must gate before starting View Transitions or WAAPI.

---

## 2) CSS Architecture Rules

### 2.1 Token-first styling

All spacing, typography, radius, shadows, colors, and motion constants come from CSS custom properties.

Required token categories:

* spacing scale
* typography scale (use `clamp()` for fluid sizes)
* radii, shadows
* color tokens (themeable)
* motion durations + easing curves
* tap target size token (`--tap: 48px`)

### 2.2 Cascade layers (strict order)

Use layers to prevent specificity wars. Recommended layer order:

1. `reset`
2. `tokens`
3. `base`
4. `layout`
5. `components`
6. `motion`
7. `utilities`
8. `overrides` (rare, must justify)

Rules:

* Prefer `:where()` to keep selector specificity low.
* Never globally remove focus outlines. Use `:focus-visible`.

### 2.3 Container queries over viewport guessing

* Components adapt via container queries (`container-type` + `@container`)
* Media queries only for major layout mode changes (shell, nav mode)

### 2.4 Performance-safe CSS

* Default animations/transitions only on `transform` and `opacity`.
* Avoid `transition: all`.
* `will-change` is forbidden unless profiling proves it helps.

### 2.5 Focus and accessibility styling

* Use `:focus-visible` with a high-contrast ring.
* Ensure rings are not clipped by overflow.
* Icon buttons must have padding so hit area meets tap target.

### 2.6 Long lists performance

* Use `content-visibility: auto` on long history/stats sections where appropriate.
* Use `contain` cautiously, test layout/positioning and accessibility behavior.

---

## 3) View Transitions Standard Operating Rules

### 3.1 When to use

Use View Transitions for:

* route changes that benefit from continuity (day → workout → history)
* meaningful component-level transitions (tab switch, list → detail hero)

Do not use for:

* set logging
* validation errors
* tiny toggles that happen constantly

### 3.2 One orchestrator only

All View Transitions must go through a single helper:

* feature-detect support
* gate on motion mode
* run DOM updates inside the transition callback
* optionally await `.finished` for cleanup

### 3.3 Shared element naming rules

* `view-transition-name` must be unique among simultaneously rendered elements
* Use deterministic names: `vt-day-YYYY-MM-DD`, `vt-exercise-${id}`, `vt-workout-${id}`
* Never assign the same name to all cards, headers, etc.

### 3.4 React commit correctness

The transition callback must produce a coherent “after” snapshot. For React:

* wrap the visual state commit in `flushSync` (only for the specific transition boundary)
* do not call transitions from render

---

## 4) React 19 Implementation Rules

1. **No side effects in render.**
2. Use `useTransition` for non-urgent work:

   * expensive filtering
   * prefetching
   * low-priority UI refinements
3. Keep route shell stable:

   * render immediate skeletons for new screens
   * hydrate/stream data without blank-screen snaps
4. StrictMode-safe code:

   * effects must clean up
   * handlers must be idempotent where relevant
5. Actions (when you use them):

   * use for mutations and pending UI
   * pair with optimistic UI only where it improves speed and confidence

---

## 5) Zustand 5 Implementation Rules

### 5.1 What belongs in Zustand (gym app)

Good fits:

* UI shell state (bottom nav, active sheet, toast queue)
* user preferences (theme, units, reduce motion toggle)
* session-like state (active workout id, timer state)
* cross-route continuity (selected day, filters)

Avoid:

* local form field state
* server cache without invalidation strategy
* large derived objects stored permanently (compute from selectors instead)

### 5.2 Selector discipline (v5)

* Prefer atomic selectors returning primitives.
* If selecting multiple fields into an object/array, use `useShallow`.
* Actions must be stable and named as verbs.

### 5.3 Slices pattern

Use a single store composed of slices:

* `uiSlice`
* `preferencesSlice`
* `workoutSessionSlice`
* `historyFiltersSlice` (if needed)

Persist only durable preferences (theme, units, reduce motion), not transient UI state.

---

## 6) Integration Rules: React + View Transitions + Zustand

### 6.1 “Transition-safe transaction” pattern

When a user triggers a navigation or meaningful UI swap:

1. Determine `motionMode`
2. If reduced or unsupported → perform update normally
3. Else:

   * start view transition
   * in the update callback:

     * `flushSync(() => { commitVisualChange(); })`
     * commitVisualChange may include:

       * router navigation
       * Zustand updates that affect the transitioned UI
       * local React state changes that affect layout

### 6.2 What not to do

* Never have “any Zustand change triggers transitions”.
* Never wrap frequent micro-actions in View Transitions.
* Never await slow network inside the transition boundary. Transition into a skeleton immediately.

---

## 7) Project-ready folder structure

```txt
src/
  app/
    main.tsx
    App.tsx
    router/                 # routing + navigation helpers
  styles/
    layers.css
    tokens.css
    base.css
    layout.css
    motion.css
    utilities.css
  transitions/
    viewTransition.ts
    reactViewTransition.tsx
  store/
    useAppStore.ts
    slices/
      uiSlice.ts
      preferencesSlice.ts
      workoutSessionSlice.ts
  features/
    calendar/
    workout/
    exercise/
    stats/
  shared/
    ui/
    lib/
```

---

## 8) Combined rules.json contract (autonomous agent)

```json
{
  "contractVersion": "2.0",
  "product": "mobile-first gym progress tracking web app",
  "corePrinciples": [
    "speed_beats_spectacle",
    "progressive_enhancement",
    "motion_safe_by_default",
    "touch_first_ergonomics",
    "predictable_css_architecture",
    "state_discipline"
  ],
  "motion": {
    "mustNotBlockInput": true,
    "useCasesAllowed": ["navigation", "meaningful_view_swaps", "list_to_detail_continuity", "tabs_if_helpful"],
    "useCasesForbidden": ["set_logging", "validation_errors", "high_frequency_toggles"],
    "durationsMs": {
      "press": [90, 120],
      "quickChange": [150, 200],
      "enter": 225,
      "exit": 195,
      "page": 300,
      "pageLargeMax": 375,
      "hardCap": 400
    },
    "easingTokensRequired": ["ease-standard", "ease-decel", "ease-accel", "ease-sharp"],
    "reducedMotion": {
      "mustRespectPrefersReducedMotion": true,
      "mustProvideInAppToggle": true,
      "singleSourceOfTruth": "motionMode",
      "cssGate": ["@media (prefers-reduced-motion: reduce)", "[data-motion='reduced']"],
      "jsGate": true
    }
  },
  "css": {
    "mustUseCascadeLayers": true,
    "layerOrder": ["reset", "tokens", "base", "layout", "components", "motion", "utilities", "overrides"],
    "tokens": {
      "mustUseCssVariables": true,
      "mustInclude": ["spacing", "typography", "radius", "shadows", "colors", "motionDurations", "motionEasings", "tapTarget"],
      "tapTargetPx": 48,
      "fluidSizing": "clamp()"
    },
    "responsiveness": {
      "preferContainerQueries": true,
      "mediaQueriesOnlyForLayoutModes": true
    },
    "specificity": {
      "preferWhereZeroSpecificity": true,
      "avoidDeepDomCoupling": true
    },
    "focus": {
      "mustUseFocusVisible": true,
      "mustNotRemoveFocusIndicators": true
    },
    "animation": {
      "avoidTransitionAll": true,
      "defaultAnimatedProperties": ["transform", "opacity"],
      "willChange": "forbiddenUnlessProfiled"
    },
    "performance": {
      "longListsPreferContentVisibilityAuto": true,
      "containUseRequiresTesting": true
    }
  },
  "viewTransitions": {
    "progressiveEnhancementRequired": true,
    "neverTriggerInRender": true,
    "mustGateByMotionMode": true,
    "mustUseSingleOrchestratorHelper": true,
    "reactCommit": {
      "mustUseFlushSyncForTransitionBoundary": true,
      "mustNotAwaitNetworkInBoundary": true,
      "mustTransitionIntoSkeletonIfDataNeeded": true
    },
    "sharedElements": {
      "prefix": "vt-",
      "mustBeUnique": true,
      "naming": ["vt-day-YYYY-MM-DD", "vt-exercise-${id}", "vt-workout-${id}"]
    }
  },
  "react19": {
    "noSideEffectsInRender": true,
    "preferUseTransitionForNonUrgentWork": true,
    "strictModeSafe": true,
    "actions": {
      "allowed": true,
      "preferredFor": ["mutations", "pending_ui", "optimistic_updates_where_helpful"]
    }
  },
  "zustand5": {
    "preferSingleStoreWithSlices": true,
    "slicesRequired": ["uiSlice", "preferencesSlice", "workoutSessionSlice"],
    "selectors": {
      "preferAtomic": true,
      "derivedObjectOrArrayMustUseShallow": true
    },
    "persistence": {
      "persistOnlyDurablePreferences": ["theme", "units", "reduceMotion"],
      "neverPersistEphemeralUiState": true
    }
  },
  "performanceRules": {
    "noLayoutThrashingInAnimatedFlows": true,
    "batchReadsThenWrites": true,
    "lowEndBudget": {
      "reduceConcurrentAnimations": true,
      "preferFadesOverLargeTranslations": true,
      "avoidHeavyBlurOrShadowAnimations": true
    }
  },
  "definitionOfDone": [
    "logging_a_set_is_never_blocked_by_animation",
    "reduced_motion_mode_is_intentional_and_complete",
    "view_transitions_have_fallback_and_do_not_break_navigation",
    "no_duplicate_view_transition_names",
    "tap_targets_meet_48px_minimum",
    "no_layout_thrashing_in_key_flows"
  ]
}
```

---

## 9) Feature-level “Definition of Done” checklist (agent must run mentally on every PR)

* ✅ No animation blocks input, ever.
* ✅ Reduced motion path is implemented in CSS and JS, plus in-app toggle.
* ✅ View transitions are wrapped by the orchestrator and have fallback.
* ✅ Shared element names are unique and deterministic.
* ✅ Tap targets meet 48px minimum.
* ✅ Long lists use `content-visibility: auto` where helpful.
* ✅ Zustand selectors are stable; multi-field selects use `useShallow`.
* ✅ Any transition boundary commits via `flushSync` and never awaits network.
