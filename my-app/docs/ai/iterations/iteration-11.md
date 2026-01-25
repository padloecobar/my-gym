# Iteration-XX — <short title>

## Goal
```
## requirements.txt — Past Workouts + Session Date (updated for your stack + current state)

### 0) Context and constraints

* Tech: **Next.js 16.1.4 App Router + React 19.2.3 + TS5 + Tailwind v4** (no legacy pages router).
* Persistence: **IndexedDB via `lib/db/index.ts`** (stores: exercises, sets, settings, mirror).
* Existing tabs: Log / History / Progress / Settings.
* Current data semantics:

  * barbell input is **per-side lb**; total = inputLb*2 + barLbSnapshot
  * dumbbell input is **per-dumbbell lb**; total = inputLb*2
  * machine total = inputLb
  * bodyweight total = 0
* File mirror: optional Chrome-only writes `gym-log.json` on data changes.

---

### 1) Goal

Enable “workout sessions by date”:

* When user logs, they are logging into a **selected session date** (default: today).
* User can easily **view and navigate past workouts** grouped by date.
* From History, user can **re-open a past date as the active logging session** (edit/add sets for that date).

---

### 2) Log tab changes (Session Date as first-class state)

#### 2.1 Session Date selector

* Log tab must show a compact **Session Date control** in the header or top session card.
* Default is local “today” (YYYY-MM-DD derived from user’s timezone).
* One-tap opens a date picker (Chrome-targeted, so native date input is acceptable).
* Provide quick chips:

  * **Today**
  * **Yesterday**
  * **Pick…** (opens picker)

#### 2.2 Session context behavior

* Selected date becomes the “active session date”:

  * All set logs go to that date.
  * “Today chips / timeline” should display sets for the active date (even if it’s not today).
* Logging into past/future dates is allowed.

#### 2.3 Timestamp rules

* Every new set entry must store:

  * `ts = Date.now()` (time of entry)
  * `date = activeSessionDate` (YYYY-MM-DD)
* History ordering uses `date` primary, then `ts`.

---

### 3) History tab requirements (fast past workout browsing)

#### 3.1 Default list view

* History displays **date groups**, newest first.
* Each date group shows a compact summary row/card:

  * Date (human readable)
  * workout label (A/B/Custom if available, otherwise “Session”)
  * total sets (count)
  * exercises logged (unique count)
  * volume summary (already planned in your state)

    * volume definition:

      * barbell volume = totalLb * reps
      * dumbbell volume = totalLb * reps (already doubled)
      * machine volume = totalLb * reps
      * bodyweight volume = reps only OR 0 (choose one; must be consistent and documented)

#### 3.2 Expand details (inline, no navigation)

* Tapping a date group expands it to show:

  * exercises in workout order if known; otherwise sorted by first-logged time
  * sets per exercise in chronological order (or newest-first, but consistent)
  * each set line shows:

    * `inputLb × reps`
    * computed `totalLb | totalKg`
    * for barbell: also show “per side + bar weight” clarity when expanded

#### 3.3 Quick actions per date

Each date group must support:

* **Open in Log**

  * sets activeSessionDate to that date and navigates to Log tab
* **Duplicate as Today**

  * creates a new “planned session” for today with same exercise list (no sets)
  * if you don’t have a session entity yet, this action can prefill the Log deck for today by selecting the workout template (A/B) that best matches
* Optional: **Export day** (JSON/CSV for that date only) using existing backup logic

---

### 4) Editing past workouts (set-level)

#### 4.1 Edit set

* Tapping a set (chip/timeline item) opens edit bottom sheet:

  * reps, inputLb, tags, note
  * recalculates totals using the set’s `barLbSnapshot` (do not retroactively apply current bar weight)
* `ts` should remain unchanged by default; optional “Update timestamp” is not required.

#### 4.2 Delete set

* Swipe delete in History, and delete action in edit sheet.
* Must use **Undo toast** (no confirmation modal for single set delete).

#### 4.3 Delete whole day (dangerous)

* Optional but recommended: “Delete session” in date group overflow.
* Requires explicit confirmation.

---

### 5) Data model + DB changes (IndexedDB)

#### 5.1 Sets store (required indexes)

Your `sets` store must support efficient queries:

* index on `date`
* composite index on (`date`, `ts`) or query + sort
* index on `exerciseId`
* optional composite on (`exerciseId`, `date`) for Progress

#### 5.2 Session entity (recommended)

Add a `sessions` store keyed by `date` (YYYY-MM-DD) to avoid inferring metadata:

* `date` (PK)
* `workoutId?: "A" | "B" | "Custom"`
* `createdAtTs`
* `updatedAtTs`
* `notes?`
* `exercisesSnapshot?: string[]` (ordered exerciseIds for that day)

If you skip sessions store:

* History must infer workout label and exercise order from sets, but this is less reliable.

#### 5.3 Active session date persistence

* Store `activeSessionDate` in `settings` so app restore returns to last used date.
* If date is older than X days, still restore (no forced “today”).

---

### 6) File mirror behavior (Chrome-only)

When File Mirror is enabled:

* Any set add/edit/delete affecting a date must trigger mirror write.
* Export format must include session date grouping OR raw sets with date field (both acceptable).
* Ensure export includes sessions metadata if you implement sessions store.

---

### 7) UX performance requirements

* Initial History load: last **14 days** (configurable) or last **N sessions**.
* Infinite scroll/pagination for older dates.
* Expanding a date group should not render the entire database; only that day’s sets.

---

### 8) Acceptance criteria

* User can pick a date (today/yesterday/custom) and log sets into that date.
* History lists sessions grouped by date with summary and expandable details.
* “Open in Log” switches activeSessionDate and shows that session’s sets.
* Editing/deleting past sets works with undo.
* All weight math remains consistent with existing rules:

  * barbell per-side + barLbSnapshot
  * dumbbell per-dumbbell doubled
  * machine direct
  * bodyweight reps-only
* All changes persist in IndexedDB and are mirrored to file if enabled.
Absolutely. Here is an upgraded version of the requirements with **modern 2026 seamless UX rules**, specifically tuned for your app’s philosophy:

* one-thumb logging
* zero friction history navigation
* no “screens that feel like admin tables”
* instant continuity between past and present workouts

---

## requirements.txt — Past Workouts + Seamless Modern UX (2026 upgrade)

### 9) Modern UX Requirements (Non-Negotiable)

These rules apply across **Log + History + Session Date flows**.

---

## 9.1 Zero-Cognition Navigation

The user must never “think about dates.”

### Required behaviors:

* The app always knows what session the user is in:

  * **Today** is default
  * Past sessions feel like “rewinding the logbook,” not switching modes

* The session date selector must be:

  * compact
  * contextual
  * always visible

Example:

```
Workout A • Today ▼
```

Not:

* a calendar screen
* a settings-style picker
* a separate workflow

---

## 9.2 History Must Feel Instant, Not Archival

History is not “old data.”
It is part of the workout flow.

### UX requirement:

Opening History should feel like:

> sliding backward through your gym timeline

Not like:

> opening a spreadsheet

### Must include:

* scroll momentum
* soft date grouping
* no harsh separators
* expandable sessions inline

---

## 9.3 “Open Past Workout” Must Be One Tap

From History:

* tapping a date immediately activates it
* user lands back in Log with that date loaded

No intermediate “details page.”

Required:

```
Tap → Log opens on that session
```

---

## 9.4 Seamless Time Travel (Session Continuity)

When viewing a past workout:

* the UI should clearly indicate:

```
Viewing: Monday • Aug 12
[Return to Today]
```

The user must never get lost.

A persistent “Return to Today” affordance is mandatory.

---

## 9.5 Past Sessions Must Be Editable Like Present

Modern apps do not treat past workouts as read-only.

### Requirements:

* sets are tappable
* edit opens same SetBuilder sheet
* delete uses Undo toast
* changes feel real-time

No separate edit screens.

---

## 9.6 Undo-First Interaction Model

No confirmation modals for small mistakes.

### Rules:

* set deletion → Undo toast
* set edit → immediate apply + Undo
* only destructive bulk actions require confirmation

Example toast:

```
Deleted 65×9   [Undo]
```

---

## 9.7 Set History Must Be Touchable, Not Decorative

Chips must not be passive.

Every logged set entry must support:

* tap → edit
* swipe → delete
* long press → annotate (optional)

History is direct manipulation.

---

## 9.8 Modern “Session Cards” Must Be Compressed

A date entry must show maximum useful info in minimum space:

* Date
* Workout label
* Sets count
* Volume
* Completion indicator

Example:

```
Mon Aug 12 • Workout A
19 sets • 5 exercises • 12,400 lb
```

No giant cards wasting scroll space.

---

## 9.9 Fast Scroll + Smart Collapse

History must never dump 500 sets on screen.

Rules:

* sessions collapsed by default
* expand only on demand
* expanding preserves scroll position
* expanding animates smoothly (not jumpy)

---

## 9.10 “Today” Must Be a Home Anchor

The app must always provide a one-tap reset:

* Return to Today
* Continue current workout

No user should ever wonder:

> “Am I logging into the wrong day?”

---

## 9.11 Progressive Enhancement: Gesture Shortcuts

Chrome-first means gestures are allowed and encouraged:

### Required gestures:

* swipe set → delete
* tap set → edit
* swipe session row → quick actions (optional)

### Optional:

* long press date → duplicate session

Gestures must always have visible fallback buttons.

---

## 9.12 Session Start Experience Must Be Smooth

When user opens Log:

* app auto-selects Today
* shows last workout suggestion
* no blocking modal

If no workout exists:

* show onboarding inline, not a separate wizard

---

## 9.13 Visual Hierarchy Rules

Modern gym UX prioritizes:

1. Next action
2. Last performance
3. Today’s work
4. Past archive

So every session view must visually emphasize:

* last set
* target suggestion
* log button

History must not overpower Log.

---

## 9.14 Microinteraction Requirements

Every log action must feel physical:

* subtle press animation
* haptic vibration (if supported)
* toast confirmation
* timeline entry appears smoothly

No silent state changes.

---

## 9.15 Performance = UX

History is only acceptable if:

* loads instantly
* scroll is 60fps
* expands without lag
* no reflow jumps

Hard requirement:

* initial History load ≤ 150ms for last 14 sessions

---

# Updated Acceptance Criteria (UX-level)

Feature is complete only if:

✅ User can jump to any past workout in one tap
✅ Past sessions feel like sliding through time, not opening files
✅ Sets are editable via the same bottom sheet
✅ Undo replaces confirmations
✅ “Return to Today” is always present
✅ History remains fast even with years of data
✅ No cognitive overhead around dates

```

## What changed (summary)
- 

## Docs checked (official links)
- 

## Implementation notes / decisions
- 

## Files changed
- 

## Verification
- `npm run lint`: ✅/❌
- `npm run build`: ✅/❌

## Next steps
- 
