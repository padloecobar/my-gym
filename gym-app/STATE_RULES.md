# State Rules (Zustand v5)

## ✅ Global Rules
- ✅ No Zustand hooks in Server Components (files using hooks must include `"use client"`).
- ✅ SSR determinism: server HTML must match first client render (don’t read `window/document/matchMedia/time/random/storage` during render to affect markup).
- ✅ Selectors must not return new arrays/objects/functions unless stabilized with `useShallow`.
- ✅ Prefer one subscription per component (group selectors + `useShallow` for heavy screens).
- ✅ Persisted slices must be serializable (no functions, DOM nodes, or class instances).
- ✅ UI store is never persisted.

## ✅ Persistence Rules
- All persistence goes through `storage/adapter` (stores never touch IndexedDB directly).
- Persisted stores must expose `hasHydrated`, `hydrate()`, and `schemaVersion`.
- Migrations must be explicit and versioned.
- Hydration must be centralized (don’t trigger hydrate/rehydrate from multiple components).

## ✅ UI Commands
- No callbacks stored in Zustand state (use command objects + centralized executor).

## ✅ Data Shape
- Session store uses normalized entities and ID maps.
- Avoid deep nested mutations; update by IDs.
