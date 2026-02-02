You are updating a Next.js App Router gym app to look and feel like a premium mobile product (not a CRUD prototype). Do NOT add third-party UI/animation libraries. Use modern CSS + existing View Transition infra. Also IMPORTANT: remove any “set completed / checkmark sets” concept; sets have no completion status.

Goals
1) Re-architect the visual system: typography, spacing, surfaces, colors, nav bar, cards.
2) Re-architect Workout Runner UX: logging flow, no set completion state, bottom sheets for editing.
3) Make globals.css consistent and token-driven (fonts, surfaces, radii, motion, VT baseline).

Hard rules
- NO “completed” status for sets anywhere (no checkbox, no “done” state, no strike-through, no progress tracking per set).
- A set is “logged” if it exists in the list. Undo = delete or edit.
- Keep app thin: no new libraries.
- Respect prefers-reduced-motion.

Work items (do in order)

A) Audit + remove “set completed” UI/state
1) Search repo for any of these and remove or refactor:
   - “completed”, “done”, “checked”, “isComplete”, “toggleSet”, “markSet”
   - UI icons for check, checkbox, progress per set
2) Files likely involved:
   - app/workout/page.tsx (runner)
   - any components rendering sets (SetRow / SetCard)
   - store state related to set completion (if any)
3) Replace interactions:
   - Tap set -> opens edit sheet
   - Add set -> appends new set (immediately counted as logged)
   - Optional: highlight newly added set for 1–2 seconds (CSS class) then fade.

B) Convert centered modals to bottom sheets
1) For set editing:
   - Replace centered dialog with a bottom sheet layout:
     - anchored to bottom, max-height ~80vh
     - rounded top corners, background dim
     - swipe-down to dismiss (optional if you already have a close button; do not add heavy gesture libs)
2) Finish confirmation:
   - Convert to action sheet style (bottom sheet) with Cancel / Finish.
3) Ensure sheet respects safe area insets and mobile keyboard.

C) Rebuild visual system (tokens + components)
1) Update globals.css to define tokens and base styles:
   - font stack
   - neutral background and surface colors
   - radii scale (choose one family: 12/16)
   - spacing rhythm (8/12/16/24)
   - one accent color used only for primary actions and selected nav
   - color-scheme: light dark
   - reduced motion baseline
   - ensure .vt-hero view-transition-name matches ui.css (vt-hero) and remove conflicting names
2) Update app/ui.css to:
   - use tokens for surfaces, borders, shadows, radii
   - reduce “pastel tinted cards”; cards should be true surface color
   - clean link styling: no underline unless actual link
3) Update key components styling:
   - ProgramCard: less padding, more density; actions aligned consistently
   - Exercise cards: clearer hierarchy, less empty space, tighter list
   - Buttons: unify sizes and radii; primary vs secondary style

D) Bottom navigation bar redesign
1) Reduce height and blur intensity, make it feel native.
2) Add icons (if you already have an icon set, use it; otherwise use simple inline SVG with currentColor).
3) Active tab indicator should be crisp:
   - small pill or underline; avoid large glowing blob.
4) Ensure safe-area padding at bottom.

E) Workout Complete screen polish
1) Add a subtle completion mark (not confetti):
   - a simple check in a circle icon near title
   - gentle enter motion (fade + slight scale) when reduced motion allows
2) Anchor “Done” button at bottom on mobile (sticky area) with safe-area padding.

Deliverables
- List of files changed with bullet notes.
- For each file, provide exact diffs or replaced blocks.
- Confirm: there is NO set completion UI/state remaining.
- Confirm: globals.css now contains the token system + font stack + motion baseline + VT hero naming consistency.
- Confirm: bottom sheets replace centered modals for frequent actions.

Acceptance test checklist
- Runner: add/edit/delete sets works; no completion toggles exist.
- Modal/sheet: set edit opens as bottom sheet.
- Motion: VT transitions still work; reduced motion disables them.
- Visual: cards are neutral surfaces; accent appears only on primary actions and active nav.
