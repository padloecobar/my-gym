# Project State Snapshot (Update every iteration)
## Compressed and LLM optimized snapshot of current project state.

- App: mobile-first gym tracker built with Next.js App Router + React 19 + Tailwind v4.
- Core tabs: Log (scrollable session bar from Today to past workouts + calendar picker w/ workout highlights, focus carousel, gesture logging, timeline per active date, composer sheet), History (session cards by date with inline expand, open in log, duplicate as today, swipe delete + edit with undo), Progress (bests + trend), Settings (workout builder, storage, presets, backup).
- Data model: exercises (type: barbell/dumbbell/machine/bodyweight, optional perSide), sets (ts + date, inputLb, reps, barLbSnapshot, totalLb/totalKg), sessions (date PK, workoutId, createdAt/updatedAt, exercisesSnapshot), settings (units, rounding, presets, e1rm formula, lastWorkout, activeSessionDate).
- IndexedDB local persistence via `lib/db/index.ts` (stores: exercises, sets w/ date/date_ts/exerciseId/exerciseId_date indexes, sessions, settings, mirror); add/delete sets update sessions metadata; openDb retries without version on VersionError.
- Calculations: per-side barbell totals = inputLb*2 + barLb; if perSide disabled, total = inputLb. Dumbbell totals = inputLb*2 (per dumbbell) or total input when perSide disabled; machine = inputLb; bodyweight = 0; kg conversion uses 0.45359237 with rounding.
- Log UX: single-exercise swipeable carousel, sticky session bar + session picker sheet, primary gesture button (tap log, swipe up x2, swipe left undo, swipe right rest timer, long-press composer), vertical timeline entries with edit/delete/warmup, toast undo, progression suggestion when rep ceiling hit.
- Composer: bottom sheet with weight + reps steppers, quick increments, warmup toggle, per-side barbell math always visible.
- Settings UX: workout tabs (A/B/+Add), search-to-add exercise with suggestions, compact rows with drag handle, type select, per-side toggle; storage section surfaces autosave + mirror status.
- File mirror (Chrome-only): optional file picker in Settings writes `gym-log.json` on any data change; mirror handle + last write stored in IDB; backup export includes sessions metadata.
- Theme: classic modern palette with cool neutrals and blue/teal accents in light/dark.
- PWA assets present (manifest + sw; cache name versioned to prevent stale bundles).
