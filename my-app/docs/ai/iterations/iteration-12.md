# Iteration-12 — Session Dates + History Sessions

## Goal
- Add session date logging (today/yesterday/custom) and session-based History with open/duplicate/edit flows.

## What changed (summary)
- Added active session date state + selector in Log, with return-to-today and date-based logging/timelines.
- Added sessions store + indexes, updated backup/mirror payloads, and threaded activeSessionDate into settings.
- Rebuilt History into session cards with pagination, inline expansion, open in log, duplicate as today, and edit/delete with undo.

## Docs checked (official links)
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/date
- https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/createIndex
- https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/openCursor

## Implementation notes / decisions
- History volume uses totalLb * reps (bodyweight volume remains 0 since totalLb is 0).
- Exercise order prefers session snapshots, then workout order for single-workout days, then first-logged order.
- Edit flows now surface undo via toast; session delete uses explicit confirmation.

## Files changed
- my-app/app/history/page.tsx
- my-app/app/page.tsx
- my-app/app/settings/page.tsx
- my-app/lib/backup.ts
- my-app/lib/date.ts
- my-app/lib/db/index.ts
- my-app/lib/fileMirror.ts
- my-app/lib/types.ts
- my-app/docs/ai/STATE.md

## Verification
- `npm run lint`: ✅
- `npm run build`: ✅

## Next steps
- Validate session duplication behavior on days that already contain sets.
- Tune History card expansion animation on device.
