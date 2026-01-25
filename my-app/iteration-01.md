# Iteration 01 - Implementation Notes

## Overview
- Built a mobile-first gym logging app with Next.js App Router, React 19, TypeScript, and Tailwind v4.
- Focused on ultra-low-tap logging, offline reliability, barbell math, and PWA install support.

## Implemented Features
- Log tab with workout deck cards, last set preview, quick actions (+ Same, Same x2, Add Set).
- Bottom sheet Set Builder with presets, delta chips, hold-to-accelerate steppers, total lb/kg display, tags, note, RPE, and quick parse input.
- Batch logging via reps chips (multi-set). Each tap logs a set and shows undo toast.
- Onboarding screen with bar weight selection, per-side barbell convention confirmation, and preloaded A/B plan.
- History tab grouped by date with search, edit bottom sheet, swipe-to-delete with undo.
- Progress tab with exercise selector, best total/e1RM, and lightweight SVG trend (last 10 sessions).
- Settings for bar weight, unit display, kg rounding, e1RM formula, presets, workout editor with drag reorder, and backup export/import (JSON/CSV).
- PWA support with manifest, service worker caching, install prompt in Settings.

## Data Model + Math
- IndexedDB stores: exercises, sets, settings in database "gymlog".
- Barbell total: totalLb = inputLb * 2 + barLb; non-barbell: totalLb = inputLb.
- totalKg uses fixed conversion (0.45359237) with configurable rounding.
- Each set stores barLbSnapshot to preserve historical totals if settings change.

## Structure
- Pages:
  - Log: `app/page.tsx`
  - History: `app/history/page.tsx`
  - Progress: `app/progress/page.tsx`
  - Settings: `app/settings/page.tsx`
- Shared components: `components/*` (AppShell, TabBar, BottomSheet, Stepper, Chip, Toast, SetBuilder, etc.).
- Libraries: `lib/db/index.ts`, `lib/calc.ts`, `lib/date.ts`, `lib/types.ts`, `lib/defaults.ts`, `lib/backup.ts`.
- PWA assets: `public/manifest.json`, `public/sw.js`, `public/icons/*`.

## UX Notes
- Primary actions remain in thumb zone with bottom navigation and sticky Set Builder footer.
- Predictive defaults in Set Builder (last set per exercise).
- Undo used instead of confirmation wherever possible.

## Deploy Notes
- Added project README with deployment instructions for Vercel, Cloudflare Pages, and Netlify.

## Commands
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
