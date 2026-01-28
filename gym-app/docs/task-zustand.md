## Mission

Refactor the app’s state architecture to:

1. Follow **Zustand v5 selector stability** practices (no unstable selector outputs).
2. Be **Next.js App Router safe** (no Zustand hooks in Server Components).
3. Be **local-first** today with **future cloud sync** tomorrow.
4. Reduce rerenders and subscriptions, improve maintainability, and make persistence explicit.

---

## Phase 0: Upgrade and guardrails

### 0.1 Upgrade packages

* Update `zustand` to a stable v5 version (latest v5.x).
* Confirm the app compiles with React 19 + Next 16.1.5 after the upgrade.

### 0.2 Add global rules for the codebase

**Agent must enforce:**

* Any file using Zustand hooks must be in a Client Component (`"use client"` at top).
* No component returns arrays/objects from selectors without shallow stabilization.
* Prefer *one subscription per component* (grouped selectors + shallow) for heavy pages.

### 0.3 Add ESLint or code-review checklist items

* ✅ “No Zustand hooks in Server Components”
* ✅ “No selector returning new array/object/function unless stabilized”
* ✅ “Persist slices must be serializable”
* ✅ “UI store is never persisted”

Deliverable: a short internal `STATE_RULES.md` file.

---

## Phase 1: Define new state boundaries

### 1.1 Split state into 4 stores (not one mega store)

**A) `settingsStore` (small, always persisted)**

* units, theme, preferences, toggles
* versioned schema + migrations

**B) `catalogStore` (reference data, persisted)**

* exercises, programs, templates
* stable, rarely changes, safe to persist

**C) `sessionStore` (high-volatility workout session)**

* active workout session state: sets, completion, timers, active workout id
* persisted *optionally* as a snapshot to recover from refresh/crash (local-first), but keep it compact

**D) `uiStore` (ephemeral UI orchestration)**

* sheet open state, confirm dialogs, snackbar state
* MUST NOT be persisted
* MUST NOT store callbacks/functions (use commands instead, see Phase 4)

**Why this matters:** different volatility + persistence needs. This prevents “everything rerenders because snackbar changed”.

Deliverable: new store modules with minimal, clean state per domain.

---

## Phase 2: Create Next.js-safe store providers (vanilla)

### 2.1 Use vanilla stores (`createStore`) and Context Providers

Create a single `AppStoreProvider` that constructs store instances once on the client.

**Rules**

* Store instances are created in a `"use client"` provider.
* Use `useRef` or `useState(() => createXStore())` to ensure one instance per mount.

Deliverables:

* `src/stores/*` store factory files
* `src/providers/AppStoreProvider.tsx`

### 2.2 Create typed hooks per store

Agent must generate hooks:

* `useSettingsStore(selector)`
* `useCatalogStore(selector)`
* `useSessionStore(selector)`
* `useUiStore(selector)`

Each:

* reads store from context
* throws if missing provider
* uses Zustand’s `useStore(store, selector)` binding

---

## Phase 3: Persistence architecture (local-first now, cloud later)

### 3.1 Implement a storage layer (adapter)

Create `src/storage/` with:

* `storage.ts`: unified interfaces like:

  * `getItem(key)`, `setItem(key, value)`, `removeItem(key)`
  * `getAllPrograms()`, `putWorkout(workout)` etc. (optional higher-level APIs)

Initially this maps to your current IndexedDB/local approach.
Later, cloud sync can wrap the same interfaces.

**Key design rule:** stores do not talk to IndexedDB directly. Stores call storage adapter methods.

Deliverables:

* `src/storage/adapter.ts` (or similar)
* `src/storage/indexeddb.ts` implementation

### 3.2 Hydration rules (critical for Next)

For persisted stores (`settings`, `catalog`, optional `session`):

Each store must have:

* `hasHydrated: boolean`
* `hydrate(): Promise<void>` action (idempotent)
* `lastHydratedAt?: number`
* hydration runs once in a top-level client component (not scattered across pages)

Deliverables:

* `hydrate()` methods in stores
* `HydrationGate` component or provider effect to call them

### 3.3 Versioning and migrations

Each persisted store has:

* `schemaVersion: number`
* `migrate(oldState, oldVersion): newState`

Deliverables:

* migration functions per store

---

## Phase 4: UI commands (remove callbacks from store state)

### 4.1 Replace callback-in-state patterns

Current code stores function callbacks in confirm sheet/snackbar payload. That’s fragile and non-serializable.

New pattern:

* UI store holds a **Command object**:

  * `{ type: "DELETE_SET", payload: { workoutId, entryId, setId } }`
* Confirm UI dispatches the command through a centralized executor.

Deliverables:

* `src/commands/types.ts`
* `src/commands/execute.ts`
* `uiStore` holds `pendingCommand?: Command`
* confirm component calls `executeCommand(command)` then closes

**Rule:** no functions in Zustand state.

---

## Phase 5: Data model normalization (session store)

### 5.1 Normalize workout session entities

Stop relying on nested mutation-prone structures.

Session store should hold:

* `activeWorkoutId: string | null`
* `workoutsById: Record<WorkoutId, Workout>`
* `entriesById: Record<EntryId, Entry>`
* `setsById: Record<SetId, Set>`
* `entryIdsByWorkoutId: Record<WorkoutId, EntryId[]>`
* `setIdsByEntryId: Record<EntryId, SetId[]>`

Actions operate on IDs, not deep nested arrays.

Deliverables:

* normalized types
* migration function to convert old nested shape to new normalized shape (one-time)

### 5.2 Store view-model selectors (cheap)

Create selectors that build the “Runner view model” but keep them:

* stable
* efficient (avoid sorting/filtering big arrays every render)

Rule:

* avoid `.filter().sort()` inside selectors unless arrays are guaranteed tiny
* store `activeWorkoutId` so “active workout” is O(1)

Deliverables:

* `src/selectors/sessionSelectors.ts`

---

## Phase 6: Zustand v5 selector practices across the app

### 6.1 Create a `useShallow`-based helper

Agent must add helpers:

* `useSessionShallow(selectorReturningObjectOrTuple)`
* `useCatalogShallow(...)`, etc.

So components naturally do the correct v5 pattern:

* one selection for data (object/tuple) + shallow compare
* one selection for actions (object/tuple) + shallow compare

Deliverables:

* hook wrappers that use `useShallow`
* update heavy pages to use grouped selectors

### 6.2 Refactor pages/components with too many subscriptions

Target: Workout runner page and any component that calls store hooks many times.

Agent must:

* group render data into one selection
* group actions into one selection
* remove duplicated calls

Acceptance criterion:

* core screens have ≤ 2 store subscriptions each (usually one data + one actions)

---

## Phase 7: Action design and immutability

### 7.1 Action naming and devtools hygiene

All actions should be named in `set()` when possible.

### 7.2 No “replace=true” unless full state

Agent must avoid `setState(partial, true)` unless providing complete state.

### 7.3 Use pure updates

All store updates must:

* preserve unrelated fields
* avoid accidental overwrites (common in nested state)

Deliverable:

* consistent update style and tests

---

## Phase 8: Offline-first + future cloud sync hooks

### 8.1 Add an Outbox (event queue) now

Even if you don’t sync yet, structure for it:

`syncStore` or `outbox` module:

* `pendingEvents: SyncEvent[]`
* `enqueue(event)`
* `markSynced(eventId)` etc.

When actions mutate domain state, they can optionally enqueue an event.

Deliverables:

* `src/sync/outbox.ts`
* event types (`WORKOUT_CREATED`, `SET_UPDATED`, etc.)

### 8.2 Keep sync out of UI components

Components call store actions only.
Store actions enqueue events.
Later, a background sync process can flush outbox.

---

## Phase 9: Migration plan (do this without breaking everything)

### 9.1 Stepwise migration strategy

Agent should not rewrite everything at once. Do it in controlled steps:

1. Introduce new stores + provider alongside old store.
2. Migrate UI store first (dialog/snackbar), since it’s isolated.
3. Migrate settings store (small, easy).
4. Migrate catalog store (programs/exercises).
5. Migrate session store last (hardest).
6. Remove old store and old hooks.

Deliverables:

* PR-style incremental commits
* feature flags if needed (temporary)

---

## Phase 10: Test plan and acceptance checks

### 10.1 Unit tests (store-level)

Write tests for:

* `startWorkout`, `addSet`, `deleteSet`, `toggleComplete`, `finishWorkout`
* migrations (old -> new normalized)
* hydration idempotency

### 10.2 Runtime checks

Agent must confirm:

* No hydration mismatch warnings in Next dev console
* App loads with empty storage and with existing storage
* Refresh mid-workout restores state if session snapshot persistence enabled
* UI dialog/snackbar still work after removing callbacks-in-state

### 10.3 Performance checks

* Runner page should not rerender excessively when unrelated UI state changes.
* Confirm shallow selectors prevent unnecessary rerenders.

---

## Deliverable file structure (recommended)

* `src/providers/AppStoreProvider.tsx`
* `src/stores/settingsStore.ts`
* `src/stores/catalogStore.ts`
* `src/stores/sessionStore.ts`
* `src/stores/uiStore.ts`
* `src/hooks/useSettingsStore.ts` (or inline with provider)
* `src/hooks/useSessionStore.ts` + shallow variants
* `src/storage/indexeddb.ts` + `src/storage/adapter.ts`
* `src/selectors/sessionSelectors.ts`
* `src/commands/types.ts` + `src/commands/execute.ts`
* `src/sync/outbox.ts`
* `STATE_RULES.md`

---

## “Definition of Done” checklist (AI agent must satisfy)

* [ ] Zustand upgraded to v5.x
* [ ] No Zustand hooks used in Server Components
* [ ] Persisted stores have `hydrate()` + `hasHydrated`
* [ ] UI store contains no functions and is not persisted
* [ ] Session store normalized and uses `activeWorkoutId`
* [ ] Heavy pages use grouped selectors + shallow compare
* [ ] Storage access goes through adapter, not directly from store logic
* [ ] Migration from old persisted shape works
* [ ] Tests added for core actions + migrations