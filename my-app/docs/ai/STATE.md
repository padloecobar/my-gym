# Project State Snapshot (Update every iteration)
## Compressed and LLM optimized snapshot of current project state.

- App: mobile-first gym tracker built with Next.js App Router + React 19 + Tailwind v4.
- Core tabs: Log (focus carousel + gesture logging + timeline + composer sheet), History (grouped by date, swipe delete, edit), Progress (bests + trend), Settings (workout builder, storage, presets, backup).
- Data model: exercises (type: barbell/dumbbell/machine/bodyweight, optional perSide flag), sets (inputLb, reps, barLbSnapshot, totalLb/totalKg), settings (units, rounding, presets, e1rm formula, lastWorkout).
- IndexedDB local persistence via `lib/db/index.ts` (stores: exercises, sets, settings, mirror).
- Calculations: per-side barbell totals = inputLb*2 + barLb; if perSide disabled, total = inputLb. Dumbbell totals = inputLb*2 (per dumbbell) or total input when perSide disabled; machine = inputLb; bodyweight = 0; kg conversion uses 0.45359237 with rounding.
- Log UX: single-exercise swipeable carousel, sticky session bar + session picker sheet, primary gesture button (tap log, swipe up x2, swipe left undo, swipe right rest timer, long-press composer), vertical timeline entries with edit/delete/warmup, toast undo, progression suggestion when rep ceiling hit.
- Composer: bottom sheet with weight + reps steppers, quick increments, warmup toggle, per-side barbell math always visible.
- Settings UX: workout tabs (A/B/+Add), search-to-add exercise with suggestions, compact rows with drag handle, type select, per-side toggle; storage section surfaces autosave + mirror status.
- File mirror (Chrome-only): optional file picker in Settings writes `gym-log.json` on any data change; mirror handle + last write stored in IDB.
- PWA assets present (manifest + sw).
