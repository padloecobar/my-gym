# Project State (Gym Runner)

This document summarizes the app's current architecture, routes, and core features to help onboard AI or new contributors quickly.

## Overview
- Product: mobile-first, offline-capable workout tracker focused on a fast Workout Runner experience.
- Stack: Next.js App Router + TypeScript + React 19 + Zustand v5.
- Deployment: static export (`output: "export"`) for GitHub Pages.
- UI system: token-driven `globals.css` + component styles in `app/ui.css`.
- Motion: View Transitions (progressive enhancement) + reduced-motion safe fallbacks.

## Build / Deploy
- Build command: `bun run build`.
- Static export: `next.config.ts` sets `output: "export"`, `basePath`, `assetPrefix`, `trailingSlash`.
- PWA: manifest via `app/manifest.ts`, service worker in `public/sw.js`, offline route `/offline`.

## Key Folders
- `app/` routes, UI components, and CSS (`globals.css`, `ui.css`, `motion.css`).
- `app/shared/` shared components + libs (navigation, view transitions, utilities).
- `store/` Zustand stores, selectors, persistence helpers.
- `commands/` typed command definitions + executor used by confirmation flows.
- `public/` static assets (icons, `sw.js`).
- `docs/` technical guidance and project state.

## Routes (App Router, static export)
Bottom tabs:
- `/` Today
- `/programs`
- `/history`
- `/settings`

Client-side detail views (query params, no dynamic routes):
- `/programs?programId=...` program detail
- `/history?workoutId=...` workout detail (read-only)
- `/workout?workoutId=...` workout runner
- `/workout/summary?workoutId=...` workout summary

Reason: dynamic segment routes are avoided for static export compatibility.

## Key UX Flows
- Start or resume a workout from Today.
- Workout Runner: log sets quickly, edit via bottom sheet, finish to summary.
- History: grouped list, tap to view detail (journal view).
- Programs: list + edit program details and exercise order.
- Settings: units, bar weight, import/export/reset.

## State Architecture
Zustand stores (via `AppStoreProvider` context):
- catalog: programs, exercises.
- session: workouts, entries, sets, active workout.
- settings: units + bar weight.
- ui: sheets, snackbars, view-transition hero state.

Selectors live in `store/selectors/*` to keep view logic stable.
`HydrationGate` ensures persisted state is ready before rendering app screens.

## Persistence / Offline
- Local-first persistence using IndexedDB wrapper (client-only).
- Autosave pattern: update Zustand first, then persist.
- Service worker caches core assets for offline shell.

## Motion & Navigation
- View Transitions are applied via helpers in `app/shared/lib/viewTransition.ts` and `app/shared/lib/navigation.ts`.
- `VtLink` wraps Next `Link` to apply transitions on navigation.
- `vt-hero` class enables shared element transitions.
Data attributes on `documentElement` control motion mode and transition style.

## UI Components (not exhaustive)
- Layout: `AppShell`, `HeaderBar`, `BottomNav`.
- Cards: `ProgramCard`, `ExerciseCard`, set rows.
- Sheets: `BottomSheet`, `EditSetSheet`, `ConfirmSheet`.
- Feedback: `Snackbar` with Undo.

## Commands
Destructive or confirmable actions are modeled as commands and executed centrally:
- Types in `commands/types.ts`
- Execution in `commands/execute.ts`

## Data Model (high level)
- Exercise: `{ id, name, type, defaultInputMode }`
- Program: `{ id, name, note?, exerciseIds[] }`
- Workout: `{ id, programId, startedAt, endedAt?, entries[] }`
- Settings: `{ unitsPreference, defaultBarWeight }`

Weights are stored as total kg and displayed as kg + lb.

## Constraints & Conventions
- Avoid new dynamic routes; use query params for detail views.
- Respect the design system in `globals.css` (tokens + layers).
- Use `useShallow` or stable selectors in Zustand to avoid rerender storms.
- Reduced motion must disable animation-heavy effects.
