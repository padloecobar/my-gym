# Required Workflow (Every Session / Iteration)

Do not implement code unless you follow these steps in order.

## 1) Understand
- Restate the user request in 1–3 bullets.
- Define acceptance criteria (what counts as done).
- Identify risks early (mobile UX, offline persistence, Safari/Chrome behavior).

## 2) Confirm contract
- Read `my-app/package.json` and `my-app/docs/ai/stack.instructions.md`.

## 3) Verify docs (official)
For any non-trivial feature:
- Check official docs (React, Next.js, Tailwind, MDN).
- Record 1–5 links in the iteration log.
- If search is unavailable, use conservative patterns and note uncertainty.

## 4) Plan
- List files to touch and why.
- Keep scope minimal and reviewable.

## 5) Implement
- Follow `my-app/docs/ai/stack.instructions.md` for platform, UI, and accessibility rules.

## 6) Verify (mandatory)
Run from `my-app/`:

```bash
npm run lint
npm run build
```

## 7) Persist project memory (mandatory)
- Update `my-app/docs/ai/STATE.md` (compressed snapshot).
- Add a new log in `my-app/docs/ai/iterations/iteration-XX.md` using the template in that folder.
- Include: goal, what changed, docs checked (links), files modified, lint/build results, next steps.

Completion rule: Steps 6–7 must be done every iteration.
