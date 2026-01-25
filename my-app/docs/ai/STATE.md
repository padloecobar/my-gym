# Project State Snapshot (Update every iteration)
## Compressed and LLM optimized snapshot of current project state.

- App: mobile-first gym tracker built with Next.js App Router + React 19 + Tailwind v4.
- Core tabs: Log (workout deck, set builder bottom sheet), History (grouped by date, swipe delete, edit), Progress (bests + lightweight trend), Settings (bar weight, units, presets, workout editor, backup import/export).
- Data model: exercises (type: barbell/dumbbell/machine/bodyweight), sets (stores inputLb, reps, barLbSnapshot, totalLb/totalKg), settings (unit display, rounding, presets, e1rm formula).
- IndexedDB local persistence via `lib/db/index.ts` (stores: exercises, sets, settings, mirror).
- Calculations: barbell total = inputLb*2 + barLb, dumbbell total = inputLb*2, machine = inputLb, bodyweight = 0; kg conversion uses 0.45359237 with rounding.
- UX: per-side barbell input, per-dumbbell input, bodyweight reps-only flow, quick multi-set logging, quick parse for weighted exercises, undo-first interactions.
- File mirror (Chrome-only): optional file picker in Settings writes `gym-log.json` on any data change; mirror handle + last write stored in IDB.
- PWA assets present (manifest + sw).
