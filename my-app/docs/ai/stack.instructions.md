---
applyTo: "**/*"
---

# Stack + Platform Contract (my-app)

Source of truth: `my-app/package.json`.

## Locked versions (keep in sync with package.json)
- next: 16.1.4 (App Router only)
- react: 19.2.3
- react-dom: 19.2.3
- tailwindcss: v4
- typescript: v5
- eslint: v9
- eslint-config-next: 16.1.4

## Target platforms
- Latest stable Chrome + Safari only.
- No experimental APIs, origin trials, or polyfills unless explicitly requested.

## Next.js + React rules
- App Router only; no Pages Router or legacy data fetching APIs.
- Server Components by default; add "use client" only when required (events, browser APIs, controlled inputs).
- React 19 patterns only; no class components or legacy lifecycles.

## Styling + UI rules
- Tailwind v4 utilities first.
- Token-based styling via `@theme` in globals; no raw color/spacing values in JSX when tokens exist.
- Use semantic utilities (`bg-*`, `text-*`, `border-*`) that map to tokens.
- Prefer CSS over JS for layout and interaction.
- Mobile-first; tap targets >= 44px.

## Accessibility
- Semantic HTML required.
- Use `:focus-visible` and keep visible focus.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.

If versions change, update this file and re-verify approaches against official docs.
