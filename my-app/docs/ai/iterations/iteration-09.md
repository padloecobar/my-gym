# Iteration-XX — <short title>

## Goal
Now the goal is bigger:

> **The fastest possible workout logging experience on mobile, with near-zero cognition, near-zero taps, and seamless flow.**

So I’ll do this in two parts:

---

# 1) Understanding the Current UI (what exists now)

## Log Screen (Workout Session)

### Strengths

* Premium aesthetic, calm grid background
* Session summary at top (sets + progress)
* Explicit “LOG 65×9” instead of vague “SAME”
* Barbell math surfaced (“per side + bar weight”)
* Today’s sets visible as chips
* Undo is now more visible

### Still fundamentally:

* Each exercise is a large static card
* Logging is button-based, not gesture-based
* “Custom” is still a modal mental break
* Session selector takes space and attention
* Set history chips are still passive (not editable)

---

## Settings Screen (Workout Editor)

### Strengths

* Simple list of exercises
* Type selector (barbell/bodyweight/dumbbell)
* Remove action

### Still missing:

* Fast add
* Reordering feels heavy
* No smart defaults
* No progression logic

---

# 2) Requirements for a UI “1,000,000× Better” (Rebuild Spec)

This is the **next-generation logging interface**.
An agent should implement it from scratch based on this spec.

---

# 🚀 NEW UI VISION: “One-Thumb Gym Operating System”

## Core Product Principle

**Logging a set should feel like tapping a metronome.**

No forms.
No pages.
No thinking.

The UI should behave like:

* a music player
* a stopwatch
* a camera shutter

Fast, confident, addictive.

---

# ✅ New Information Architecture

Instead of “cards stacked vertically”, the app is built around:

## A. Active Exercise Focus Mode

## B. Swipe-Based Exercise Navigation

## C. Bottom Sheet Set Composer

## D. Timeline-Based Set History

---

# 🧠 LOG SCREEN V2: Focus-First Interface

## Layout Structure

### Top: Session Bar (Sticky, Minimal)

A single thin header:

```
Workout A • Bench Focus
19 sets • 5/5 complete
[ Sync ✓ ]     [ Settings ⚙ ]
```

No big card. No wasted space.

---

## Main Area: Active Exercise Carousel

Only ONE exercise is active at a time.

You swipe horizontally between exercises:

```
← Deadlift | Bench Press | Dips →
```

Each exercise is full focus, not stacked.

This eliminates scrolling during workouts.

---

## Exercise View: “Set Logging Console”

### Exercise Header

```
Жим штанги лежа
Barbell • Per side mode
Last: 65×9   Target: +2.5 lb
```

---

## Primary Action Zone (Thumb Zone)

At the bottom center:

### Giant button:

```
+ 65×9
```

One tap logs the next set instantly.

This is the default action always.

---

### Secondary actions (gesture-first)

* Swipe button up → logs ×2
* Long press → opens composer
* Swipe left → undo
* Swipe right → rest timer

No extra buttons needed.

---

# ⚡ Set Composer (Bottom Sheet)

Custom entry is NEVER a separate page.

Tapping/holding opens a bottom sheet:

---

## Bottom Sheet UI

### Weight stepper (big, thumbable)

```
–  65 lb  +
(per side)
Total: 175 lb • 79.4 kg
```

Quick jump chips:

```
+2.5   +5   +10
```

---

### Reps stepper

```
–  9 reps  +
```

Preset chips:

```
5   8   10   12
```

---

### Confirm button

```
LOG SET
```

Sheet closes instantly.

---

# 🕒 Set Timeline (Instead of Chips)

Below the main button:

A vertical timeline:

```
● 65×9   18:42
● 65×10  18:39
● 60×10  18:35
```

Each entry is tappable:

* edit
* delete
* mark warmup

This is infinitely better than passive pills.

---

# ✅ Undo UX (Modern Standard)

Undo is NOT a button in the card.

After logging:

Toast appears:

```
Logged 65×9   [Undo]
```

Disappears after 4 seconds.

---

# 🧩 Progression Intelligence (Built-In)

The UI should guide overload automatically:

* Detect rep ceiling hit
* Suggest next weight
* Highlight “target set”

Example:

```
Next: 67.5×8 (recommended)
```

User can accept with one tap.

---

# 🏋️ Workout Structure UX

Workout A/B selector is removed from main log.

Instead:

### Session Picker is a separate sheet

Tap session name → opens:

```
Workout A (Bench + Deadlift)
Workout B (Squat + Rows)
+ New Workout
```

No toggle pills.

---

# ⚙ SETTINGS V2: Workout Builder

Settings becomes a true “program editor”.

## Workout Editor Screen

### Workout tabs

```
A   B   + Add
```

---

### Exercise rows are compact

Each row:

```
Bench Press   [Barbell] [Per-side ✓]
Drag handle
```

No giant cards.

---

### Add exercise is instant

Top search bar:

```
Search or add exercise...
```

Typing “row” suggests:

* Barbell Row
* Cable Row
* Machine Row

Tap → added.

No forms.

---

# 📱 Mobile-First Requirements

## Touch + Motion

* Swipe between exercises
* Long press to edit last set
* Haptic feedback on log
* Bottom sheet always reachable

## Tap economy target

Logging a normal set must take:

✅ 1 tap
Custom set must take:

✅ 2 taps max
Undo must take:

✅ 1 tap

---

# 💾 Local + File Mirror Sync Integration

Settings includes:

```
Storage
✓ Local autosave
✓ Mirror file enabled
Last write: Today 18:42
[Export Backup]
```

---

# Brand & Visual Language

The UI should feel like:

* minimalist industrial tool
* calm athletic notebook
* Swiss watch precision

No clutter.
No extra UI chrome.
Everything is action.

---

# Implementation Checklist for Agent

An agent implementing from scratch must build:

## Log Screen

* Swipeable exercise carousel
* Single primary log button
* Gesture shortcuts (x2, undo, timer)
* Timeline history with edit

## Composer

* Bottom sheet steppers
* Quick increment chips
* Per-side barbell math always visible

## Settings

* Compact workout builder
* Search-to-add exercises
* Per-side toggle per lift

## UX Guarantees

* No scrolling during workout
* No keyboard needed for common flow
* Undo via toast
* Progression suggestion built in

---

# Final Note: What This Becomes

This UI is no longer “a tracker”.

It becomes a **gym operating system**:

* swipe
* tap
* log
* repeat

Like turning pages in a notebook, but instant. 

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
