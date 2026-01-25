ROLE
You are a senior mobile product engineer + UX designer. Build a beautiful mobile-first web app to track gym exercise sets with extremely low-click UX. The user logs weights in LB. For barbell lifts, the user enters ONLY the plate weight on ONE side; the app must compute the full barbell total weight including bar weight and both sides. App must always show KG conversions automatically. This must work perfectly on mobile web (iPhone Safari + Android Chrome). The app is personal use; prioritize speed, offline reliability, and a “feels like native” experience.

TECH STACK (MANDATORY)
Use this exact stack:
- Next.js 16.1.4 (App Router)
- React 19.2.3
- TypeScript
- Tailwind CSS v4
- No heavy UI frameworks. You may implement small UI primitives yourself.
- Persistence: IndexedDB (preferred) with a small wrapper; use localStorage only for tiny settings.
- PWA: manifest + service worker for offline install (Add to Home Screen).
- No external services required (local-only). Cloud sync optional as a future extension but not implemented now.

GOALS
Primary: Logging a set should take 1–3 taps in common cases.
Secondary: Great readability, easy history review, quick edit/undo, offline-first.
Tertiary: Lightweight progress view (no heavy chart libs).

HARD REQUIREMENTS
- Input unit: LB always.
- Barbell input convention: user enters per-side plates in lb (ONE SIDE only).
- Computations:
  - LB_TO_KG = 0.45359237
  - If type == "barbell":
      totalLb = inputLb*2 + barLb
    else:
      totalLb = inputLb
    totalKg = totalLb * LB_TO_KG
- Default barLb = 45 lb (editable in Settings).
- Must store a snapshot of barLb on each set entry (in case setting changes later).
- App must be fully functional offline, persist data across reloads, and support export/import.

KEY UX PRINCIPLES (VERY IMPORTANT)
- “No-scroll logging”: primary logging controls must stay in thumb zone.
- “No-keyboard first”: minimize typing. Use chips, presets, stepper with long-press acceleration.
- “Predictive defaults”: pre-fill weight/reps/type based on last set for that exercise.
- “One-tap repeat”: big “+ Same as last” per exercise, plus optional “+ Same ×2”.
- “Batch entry”: support logging multiple sets fast without reopening dialogs.
- “Undo not confirm”: allow destructive actions with undo instead of confirmation dialogs whenever safe.

INFORMATION ARCHITECTURE
Use a bottom nav with 3 tabs:
1) Log (default)
2) History
3) Progress
Settings is a small icon in the Log header (or a 4th tab if you prefer), but logging must remain fastest.

DATA MODEL (TypeScript)
Exercise:
- id: string (uuid)
- name: string
- type: "barbell" | "dumbbell" | "machine" | "bodyweight"
- workout: "A" | "B" | "Custom"
- order: number
- createdAt: number

SetEntry:
- id: string (uuid)
- ts: number (timestamp ms)
- date: string (local YYYY-MM-DD)
- exerciseId: string
- reps: number
- inputLb: number
- barLbSnapshot: number
- totalLb: number
- totalKg: number
- note?: string
- tags?: string[] (e.g. ["easy","pause","slow"])
- meta?: { rpe?: number }

APP FEATURES

A) FIRST-RUN ONBOARDING (one screen, fast)
- Ask bar weight (default 45 lb) with a picker.
- Confirm barbell convention: “For barbell, you enter weight on ONE side only”.
- Preload a minimal 2-day plan:
  Workout A: Squat (barbell), Bench Press (barbell), Lat Pulldown (machine)
  Workout B: Deadlift (barbell), Overhead Press (barbell), Row (barbell or machine)
- Finish -> go to Log.

B) LOG TAB (THE HEART)
Design as a “Workout Deck”:
- Top: Today suggestion (A/B) based on last workout. One-tap switch.
- Each exercise is a card with:
  - Name + type badge
  - Last set summary (e.g., “Last: 45×12 (61.2kg total)”)
  - Primary action row (always visible):
      [ + Same ]  [ Add Set ]
  - When tapping Add Set, open a bottom sheet (NOT a new page).

Bottom Sheet: “Set Builder”
Must allow ultra-fast entry:
1) Weight section:
   - For barbell: show “Per side (lb)” big number with:
       - preset grid: 25, 35, 45, 55, 65, 75, 85, 95 (configurable)
       - delta chips: +5, +2.5, +1 (tap)
       - hold-to-accelerate +/- buttons
   - For non-barbell: similar but without “per side” label.
   - Live computed display always visible:
       - “Total: XXX lb | YYY kg”
       - For barbell also show “(includes 45 lb bar)” clearly.

2) Reps section:
   - big chips: 3, 5, 8, 10, 12, 15
   - +/- stepper with hold-to-accelerate
   - default from last set

3) Batch logging mode (CRITICAL):
   Provide “Multi-set” row:
   - A horizontal strip of recent reps chips.
   - When user taps reps chips repeatedly, each tap logs a set instantly using current weight.
     Example: weight=45, tap [12][10][8] logs 3 sets without pressing Save.
   - Show a small “Saved • Undo” toast each time.
   - Also provide a single “Save Set” button for normal flow.

4) Quick tags:
   - small toggles: easy, pause, slow
   - optional note (collapsed by default)

5) After logging:
   - The exercise card shows a mini list of sets logged today (most recent first).
   - Provide “Undo last set” on card.

Ultra-low click target:
- Common flow for repeated sets: 1 tap “+ Same”
- New weight, multiple sets: choose preset weight (1 tap) then tap reps chips 3 times (3 taps) = logs 3 sets.

C) QUICK PARSE (optional but high value)
For power users, add an optional “Quick entry line” inside Set Builder:
- User can type: `45x12,10,8` or `45x12 55x8` etc.
- Parse into sets:
   - token pattern: weight x repslist
- This is optional and hidden behind a small “⌨︎ quick parse” button so it doesn’t ruin the no-keyboard UX.

D) HISTORY TAB
- Group by date.
- Each date card shows exercises and set lines.
- Editing:
  - Tap a set line opens an edit bottom sheet with same controls (weight/reps/tags/note).
  - Delete uses swipe action and shows Undo toast.
- Search by exercise name (simple input).

E) PROGRESS TAB (lightweight)
- Exercise selector (list with search).
- Show:
  - Best totalKg (barbell uses total; non-barbell uses input as total)
  - Best e1RM (user can select formula in settings)
  - Simple trend chart (SVG) for last 10 sessions: either best set per session or e1RM.
- No heavy chart libraries.

F) SETTINGS
- Bar weight (lb)
- Display preferences:
  - show both lb/kg (default), or lb only, or kg only (input remains lb)
  - rounding: 0.1kg default
- Workout editor:
  - Edit Workout A and B lists, reorder via drag handle, add/remove exercise.
  - Choose type for each exercise.
- Backup:
  - Export JSON (preferred)
  - Export CSV
  - Import JSON/CSV with mapping by exercise name; create if missing.

PERSISTENCE DETAILS
- IndexedDB database name: "gymlog"
- stores:
  - "exercises" (keyPath id)
  - "sets" (keyPath id, indexes: date, exerciseId, ts)
  - "settings" (keyPath key)
- Implement small db wrapper with:
  - getAllExercises(), saveExercise(), reorderExercises()
  - addSet(), updateSet(), deleteSet()
  - querySetsByDate(), querySetsByExercise(exerciseId)
- Ensure all writes are atomic and resilient (try/catch + user feedback).

PWA
- Provide manifest with icons, theme colors.
- Service worker caches static assets and supports offline.
- Add a subtle prompt “Install” in Settings (not intrusive).

DESIGN SYSTEM / TAILWIND
- Use Tailwind v4.
- Use system font stack.
- Dark mode first with automatic light support.
- Components: Card, BottomSheet, Chip, Stepper, Toast, TabBar.
- Touch targets >= 44px.
- Sticky bottom action area for the Set Builder to keep Save/Undo reachable.

PROJECT STRUCTURE (NEXT APP ROUTER)
- app/layout.tsx (global layout, PWA meta)
- app/page.tsx (Log)
- app/history/page.tsx
- app/progress/page.tsx
- app/settings/page.tsx
- components/*
- lib/db/* (IndexedDB wrapper)
- lib/calc.ts (lb->kg, totals, e1RM)
- lib/date.ts (local date utils)
- public/manifest.json
- public/sw.js
- public/icons/*

ACCEPTANCE CRITERIA
- On mobile, user can log a repeated set in 1 tap (“+ Same”).
- User can log 3 sets at a new weight with ≤ 4 taps using presets + reps chips batch mode.
- Barbell math always correct (per-side + bar + both sides).
- App usable offline, data persists.
- Export/Import works.
- UI is polished, fast, no jank, no tiny controls.

DELIVERABLES
Return full source code for the Next.js project implementing all above, including:
- all pages/components
- IndexedDB wrapper
- PWA setup (manifest + SW)
- deploy instructions for:
  - Vercel (static + SSR capable)
  - Cloudflare Pages (Next support)
  - Netlify (if feasible)
No third-party auth, no external DB in this version.
