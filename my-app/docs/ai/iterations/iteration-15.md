# Iteration-15 — IndexedDB VersionError Fallback

## Goal
- Prevent "requested version is less than existing version" errors when opening IndexedDB.

## What changed (summary)
- Added an openDb fallback that retries without a version when VersionError is thrown.

## Docs checked (official links)
- https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/open

## Implementation notes / decisions
- VersionError fallback opens the latest existing database instead of failing.

## Files changed
- my-app/lib/db/index.ts
- my-app/docs/ai/STATE.md

## Verification
- `npm run lint`: ✅
- `npm run build`: ✅

## Next steps
- If errors persist, consider prompting a hard reload or clearing site data.
