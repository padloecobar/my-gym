# Iteration-14 — Fix IndexedDB VersionError

## Goal
- Resolve "requested version is less than existing version" error when starting logging.

## What changed (summary)
- Bumped service worker cache name to force fresh bundles after DB version upgrade.

## Docs checked (official links)
- https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage

## Implementation notes / decisions
- Cache name versioning ensures clients drop old cached JS that still opens the old DB version.

## Files changed
- my-app/public/sw.js
- my-app/docs/ai/STATE.md

## Verification
- `npm run lint`: ✅
- `npm run build`: ✅

## Next steps
- If any users still see the error, consider prompting a hard reload on SW update.
