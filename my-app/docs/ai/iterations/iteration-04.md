# Iteration-04 — Auto JSON Mirror Sync

## Goal
- Keep a JSON mirror snapshot updated automatically on any data change.

## What changed (summary)
- File mirror now writes JSON only and restricts picker to `.json`.
- Added a DB change event and a global sync listener that debounces writes.
- Updated Settings copy and removed the log-only mirror write call.

## Docs checked (official links)
- https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
- https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker
- https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle/createWritable
- https://react.dev/reference/react/useEffect
- https://nextjs.org/docs/app

## Implementation notes / decisions
- DB writes dispatch a `gymlog:db-change` event; mirror sync debounces to avoid bursty writes.
- Mirror stays human-readable JSON to support manual inspection and edits.

## Files changed
- my-app/lib/db/index.ts
- my-app/lib/fileMirror.ts
- my-app/components/FileMirrorSync.tsx
- my-app/components/AppShell.tsx
- my-app/app/page.tsx
- my-app/app/settings/page.tsx
- my-app/docs/ai/STATE.md

## Verification
- `npm run lint`: ✅
- `npm run build`: ✅

## Next steps
- Test mirror updates after settings edits, exercise reorders, and import flows.
