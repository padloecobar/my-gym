# Iteration-02 — Dumbbell + Bodyweight UX

## Goal
- Align logging and totals with MVP rules for dumbbell and bodyweight exercises.

## What changed (summary)
- Updated total-weight calculations to double dumbbell inputs and treat bodyweight as reps-only.
- Tweaked Set Builder labels/flow for per-dumbbell input and hid weight UI for bodyweight.
- Adjusted Log/History/Progress displays to show bodyweight sets as reps-first and avoid bogus totals.

## Docs checked (official links)
- https://react.dev/reference/react/useEffect
- https://react.dev/reference/react/useState
- https://nextjs.org/docs/app
- https://tailwindcss.com/docs/utility-first

## Implementation notes / decisions
- Bodyweight sets normalize to `inputLb = 0` and display as `BW x reps`.
- Progress chart switches to reps for bodyweight exercises to avoid zero-weight trends.

## Files changed
- my-app/lib/calc.ts
- my-app/components/SetBuilder.tsx
- my-app/components/ExerciseCard.tsx
- my-app/app/history/page.tsx
- my-app/app/progress/page.tsx
- my-app/docs/ai/STATE.md

## Verification
- `npm run lint`: ✅
- `npm run build`: ✅

## Next steps
- Sanity-check bodyweight logging on device to confirm reps-only flow feels good.
