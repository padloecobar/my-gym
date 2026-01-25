# Iteration-03 — File Mirror Mode

## Goal
- Add Chrome-only file mirror mode that writes a local gym-log.json on set save.

## What changed (summary)
- Added File System Access helpers to pick a mirror file, write snapshots, and track last write time.
- Added a new IndexedDB mirror store for the file handle/metadata.
- Added Settings UI controls for enable/write/disable and hooked mirror writes into log saves.

## Docs checked (official links)
- https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API (search unavailable)
- https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker (search unavailable)
- https://react.dev/reference/react/useEffect (search unavailable)
- https://nextjs.org/docs/app (search unavailable)
- https://tailwindcss.com/docs/installation (search unavailable)

## Implementation notes / decisions
- Mirror data is a full snapshot export from IndexedDB; NDJSON uses a single-line JSON record.
- File handle and last-write timestamp are stored in a dedicated IndexedDB object store.
- Background mirror writes are best-effort and do not block logging UX.

## Files changed
- my-app/lib/db/index.ts
- my-app/lib/fileMirror.ts
- my-app/lib/backup.ts
- my-app/app/page.tsx
- my-app/app/settings/page.tsx
- my-app/docs/ai/STATE.md

## Verification
- `npm run lint`: ✅
- `npm run build`: ✅

## Next steps
- Test file mirror enable/write/disable flows in Chrome on desktop and Android.
