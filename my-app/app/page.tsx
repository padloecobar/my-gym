"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";
import BottomSheet from "../components/BottomSheet";
import Onboarding from "../components/Onboarding";
import SetComposer, { type SetDraft } from "../components/SetComposer";
import Toast from "../components/Toast";
import {
  IconChevronDown,
  IconSettings,
  IconTimer,
} from "../components/Icons";
import {
  addSet,
  deleteSet,
  getAllExercises,
  getAllSessions,
  getAllSettings,
  getAllSets,
  getSession,
  saveExercises,
  setSettings,
  updateSet,
} from "../lib/db";
import { computeTotals, formatLb } from "../lib/calc";
import {
  formatDateHeading,
  formatSessionDateLabel,
  formatShortTime,
  getLocalDateKey,
} from "../lib/date";
import { createDefaultExercises, defaultSettings } from "../lib/defaults";
import type {
  Exercise,
  SessionEntry,
  SetEntry,
  SettingsState,
  WorkoutId,
} from "../lib/types";

const typeLabel = (type: Exercise["type"]) => {
  switch (type) {
    case "barbell":
      return "Barbell";
    case "dumbbell":
      return "Dumbbell";
    case "machine":
      return "Machine";
    case "bodyweight":
      return "Bodyweight";
    default:
      return type;
  }
};

const getWeightStep = (exercise: Exercise) => {
  if (exercise.type === "barbell") {
    return exercise.perSide ?? true ? 2.5 : 5;
  }
  return 5;
};

const getModeLabel = (exercise: Exercise) => {
  if (exercise.type === "barbell") {
    return exercise.perSide ?? true ? "Per side" : "Total on bar";
  }
  if (exercise.type === "dumbbell") {
    return exercise.perSide ?? true ? "Per dumbbell" : "Total load";
  }
  if (exercise.type === "bodyweight") {
    return "Reps only";
  }
  return "Weight";
};

const LogPage = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sets, setSets] = useState<SetEntry[]>([]);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [settings, setSettingsState] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [activeSessionDate, setActiveSessionDate] = useState(getLocalDateKey());
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutId | null>(null);
  const [sessionPickerOpen, setSessionPickerOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerSeed, setComposerSeed] = useState<{ inputLb: number; reps: number } | null>(
    null,
  );
  const [editingSet, setEditingSet] = useState<SetEntry | null>(null);
  const [toast, setToast] = useState<{ message: string; action?: () => void } | null>(
    null,
  );
  const toastTimer = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const scrollRaf = useRef<number | null>(null);
  const [restTimerEndsAt, setRestTimerEndsAt] = useState<number | null>(null);
  const [restTick, setRestTick] = useState(Date.now());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const gestureRef = useRef<{
    startX: number;
    startY: number;
    active: boolean;
    triggered: boolean;
    skipClick: boolean;
    longPressTimer: number | null;
  }>({
    startX: 0,
    startY: 0,
    active: false,
    triggered: false,
    skipClick: false,
    longPressTimer: null,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [exerciseData, sessionData, settingsData, setData] = await Promise.all([
          getAllExercises(),
          getAllSessions(),
          getAllSettings(),
          getAllSets(),
        ]);
        const todayKey = getLocalDateKey();
        const sessionDate =
          typeof settingsData.activeSessionDate === "string"
            ? settingsData.activeSessionDate
            : todayKey;
        const mergedSettings = {
          ...defaultSettings,
          ...settingsData,
          activeSessionDate: sessionDate,
        } as SettingsState;
        setExercises(exerciseData);
        setSessions(sessionData);
        setSettingsState(mergedSettings);
        setSets(setData);
        setActiveSessionDate(sessionDate);
        const activeDate = new Date(sessionDate);
        setCalendarMonth({
          year: activeDate.getFullYear(),
          month: activeDate.getMonth(),
        });
        if (settingsData.activeSessionDate !== sessionDate) {
          await setSettings({ activeSessionDate: sessionDate });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
      if (scrollRaf.current) {
        window.cancelAnimationFrame(scrollRaf.current);
      }
    };
  }, []);

  const workouts = useMemo<WorkoutId[]>(() => {
    const hasCustom = exercises.some((exercise) => exercise.workout === "Custom");
    const base: WorkoutId[] = ["A", "B"];
    if (hasCustom) base.push("Custom");
    return base;
  }, [exercises]);

  useEffect(() => {
    if (!workouts.length) return;
    if (selectedWorkout && workouts.includes(selectedWorkout)) return;
    const fallback =
      settings.lastWorkout && workouts.includes(settings.lastWorkout)
        ? settings.lastWorkout
        : workouts[0];
    setSelectedWorkout(fallback);
  }, [selectedWorkout, settings.lastWorkout, workouts]);

  const activeWorkout = selectedWorkout ?? workouts[0] ?? "A";

  const exercisesForWorkout = useMemo(() => {
    return exercises
      .filter((exercise) => exercise.workout === activeWorkout)
      .sort((a, b) => a.order - b.order);
  }, [activeWorkout, exercises]);

  useEffect(() => {
    setActiveIndex(0);
    if (carouselRef.current) {
      carouselRef.current.scrollTo({ left: 0, behavior: "auto" });
    }
  }, [activeWorkout]);

  useEffect(() => {
    setActiveIndex((prev) =>
      Math.min(prev, Math.max(0, exercisesForWorkout.length - 1)),
    );
  }, [exercisesForWorkout.length]);

  const todayKey = getLocalDateKey();
  const sessionDateLabel = formatSessionDateLabel(activeSessionDate, todayKey);
  const sessionBarDates = useMemo(() => {
    const dates = sessions
      .map((session) => session.date)
      .filter((date) => date <= todayKey);
    const list = [todayKey, activeSessionDate, ...dates];
    const unique = new Set<string>();
    return list.filter((date) => {
      if (unique.has(date)) return false;
      unique.add(date);
      return true;
    });
  }, [activeSessionDate, sessions, todayKey]);

  const workoutDateSet = useMemo(
    () => new Set(sessions.map((session) => session.date)),
    [sessions],
  );

  const calendarMonthLabel = useMemo(() => {
    const date = new Date(calendarMonth.year, calendarMonth.month, 1);
    return date.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }, [calendarMonth.month, calendarMonth.year]);

  const calendarDays = useMemo(() => {
    const days: Array<{
      dateKey: string;
      day: number;
      isToday: boolean;
      isActive: boolean;
      hasWorkout: boolean;
    } | null> = [];
    const firstDay = new Date(calendarMonth.year, calendarMonth.month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(
      calendarMonth.year,
      calendarMonth.month + 1,
      0,
    ).getDate();
    const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;
    for (let i = 0; i < totalCells; i += 1) {
      const dayNumber = i - startWeekday + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        days.push(null);
        continue;
      }
      const dateKey = `${calendarMonth.year}-${String(
        calendarMonth.month + 1,
      ).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
      days.push({
        dateKey,
        day: dayNumber,
        isToday: dateKey === todayKey,
        isActive: dateKey === activeSessionDate,
        hasWorkout: workoutDateSet.has(dateKey),
      });
    }
    return days;
  }, [
    activeSessionDate,
    calendarMonth.month,
    calendarMonth.year,
    todayKey,
    workoutDateSet,
  ]);

  const openCalendar = useCallback(() => {
    const date = new Date(activeSessionDate);
    setCalendarMonth({ year: date.getFullYear(), month: date.getMonth() });
    setCalendarOpen(true);
  }, [activeSessionDate]);

  const handlePrevMonth = useCallback(() => {
    setCalendarMonth((prev) => {
      const nextMonth = prev.month - 1;
      if (nextMonth < 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: nextMonth };
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCalendarMonth((prev) => {
      const nextMonth = prev.month + 1;
      if (nextMonth > 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: nextMonth };
    });
  }, []);

  const { lastSetByExercise, sessionSetsByExercise } = useMemo(() => {
    const lastMap = new Map<string, SetEntry>();
    const sessionMap = new Map<string, SetEntry[]>();
    sets.forEach((set) => {
      if (!lastMap.has(set.exerciseId)) {
        lastMap.set(set.exerciseId, set);
      }
      if (set.date === activeSessionDate) {
        const list = sessionMap.get(set.exerciseId) ?? [];
        list.push(set);
        sessionMap.set(set.exerciseId, list);
      }
    });
    return { lastSetByExercise: lastMap, sessionSetsByExercise: sessionMap };
  }, [activeSessionDate, sets]);

  const workoutMeta = useMemo(() => {
    return workouts.map((workout) => {
      const list = exercises
        .filter((exercise) => exercise.workout === workout)
        .sort((a, b) => a.order - b.order);
      const focus = list.slice(0, 2).map((exercise) => exercise.name).join(" + ");
      const completed = list.filter(
        (exercise) => (sessionSetsByExercise.get(exercise.id) ?? []).length > 0,
      ).length;
      const setCount = list.reduce(
        (total, exercise) =>
          total + (sessionSetsByExercise.get(exercise.id) ?? []).length,
        0,
      );
      return {
        workout,
        focus,
        total: list.length,
        completed,
        setCount,
      };
    });
  }, [exercises, sessionSetsByExercise, workouts]);

  const activeMeta = workoutMeta.find((meta) => meta.workout === activeWorkout);
  const activeCompleted = activeMeta?.completed ?? 0;
  const activeSetCount = activeMeta?.setCount ?? 0;

  const activeExercise = exercisesForWorkout[activeIndex] ?? null;
  const lastSet = activeExercise
    ? lastSetByExercise.get(activeExercise.id) ?? null
    : null;
  const sessionSets = activeExercise
    ? sessionSetsByExercise.get(activeExercise.id) ?? []
    : [];

  const exerciseById = useMemo(() => {
    return new Map(exercises.map((exercise) => [exercise.id, exercise]));
  }, [exercises]);

  const needsOnboarding = !settings.onboarded || exercises.length === 0;

  const sortSessionsDesc = useCallback(
    (items: SessionEntry[]) =>
      [...items].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [],
  );

  const refreshSessionDate = useCallback(
    async (date: string) => {
      const session = await getSession(date);
      if (!session) return;
      setSessions((prev) => {
        const next = prev.filter((item) => item.date !== date);
        next.push(session);
        return sortSessionsDesc(next);
      });
    },
    [sortSessionsDesc],
  );

  const removeSessionDate = useCallback((date: string) => {
    setSessions((prev) => prev.filter((item) => item.date !== date));
  }, []);

  const updateSessionDate = useCallback(async (nextDate: string) => {
    if (!nextDate) return;
    const date = new Date(nextDate);
    setActiveSessionDate(nextDate);
    setCalendarMonth({
      year: date.getFullYear(),
      month: date.getMonth(),
    });
    setSettingsState((prev) => ({ ...prev, activeSessionDate: nextDate }));
    await setSettings({ activeSessionDate: nextDate });
  }, []);

  const showToast = useCallback((message: string, action?: () => void) => {
    setToast({ message, action });
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);
  }, []);

  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (typeof navigator === "undefined") return;
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const formatSetLabel = useCallback((entry: SetEntry, exercise: Exercise) => {
    return exercise.type === "bodyweight"
      ? `BWx${entry.reps}`
      : `${formatLb(entry.inputLb)}x${entry.reps}`;
  }, []);

  const createSetEntry = useCallback(
    (
      exercise: Exercise,
      draft: {
        inputLb: number;
        reps: number;
        tags: string[];
        note: string;
        rpe?: number;
      },
    ): SetEntry => {
      const ts = Date.now();
      const barLbSnapshot = settings.barLb;
      const perSide =
        exercise.type === "barbell" || exercise.type === "dumbbell"
          ? exercise.perSide ?? true
          : false;
      const totals = computeTotals(
        draft.inputLb,
        exercise.type,
        barLbSnapshot,
        settings.roundingKg,
        perSide,
      );
      return {
        id: crypto.randomUUID(),
        ts,
        date: activeSessionDate,
        exerciseId: exercise.id,
        reps: draft.reps,
        inputLb: draft.inputLb,
        barLbSnapshot,
        totalLb: totals.totalLb,
        totalKg: totals.totalKg,
        note: draft.note || undefined,
        tags: draft.tags.length ? draft.tags : undefined,
        meta: draft.rpe ? { rpe: draft.rpe } : undefined,
      };
    },
    [activeSessionDate, settings.barLb, settings.roundingKg],
  );

  const handleAddSet = useCallback(
    async (
      exercise: Exercise,
      draft: {
        inputLb: number;
        reps: number;
        tags: string[];
        note: string;
        rpe?: number;
      },
      options?: { silent?: boolean },
    ) => {
      const entry = createSetEntry(exercise, draft);
      try {
        await addSet(entry);
        setSets((prev) => [entry, ...prev]);
        await refreshSessionDate(entry.date);
        const nextSettings = { ...settings, lastWorkout: exercise.workout };
        setSettingsState(nextSettings);
        await setSettings({ lastWorkout: exercise.workout });
        triggerHaptic(8);
        if (!options?.silent) {
          showToast(`Logged ${formatSetLabel(entry, exercise)}`, async () => {
            await deleteSet(entry.id);
            setSets((prev) => {
              const next = prev.filter((item) => item.id !== entry.id);
              const stillHasDate = next.some((item) => item.date === entry.date);
              if (!stillHasDate) {
                removeSessionDate(entry.date);
              }
              return next;
            });
          });
        }
      } catch (error) {
        console.error(error);
        showToast("Could not save set");
      }
    },
    [
      createSetEntry,
      formatSetLabel,
      refreshSessionDate,
      removeSessionDate,
      settings,
      showToast,
      triggerHaptic,
    ],
  );

  const handleOnboardingComplete = useCallback(async (barLb: number) => {
    const seeded = createDefaultExercises();
    const nextSettings: SettingsState = {
      ...defaultSettings,
      barLb,
      activeSessionDate,
      onboarded: true,
    };
    await saveExercises(seeded);
    await setSettings(nextSettings);
    setExercises(seeded);
    setSettingsState(nextSettings);
  }, [activeSessionDate]);

  const handleUndoToday = useCallback(
    async (exerciseId: string) => {
      const sessionSetsList = sessionSetsByExercise.get(exerciseId) ?? [];
      const latest = sessionSetsList[0];
      if (!latest) {
        showToast("No sets to undo.");
        return;
      }
      await deleteSet(latest.id);
      setSets((prev) => {
        const next = prev.filter((item) => item.id !== latest.id);
        const stillHasDate = next.some((item) => item.date === latest.date);
        if (!stillHasDate) {
          removeSessionDate(latest.date);
        }
        return next;
      });
      showToast("Undid last set.");
    },
    [removeSessionDate, sessionSetsByExercise, showToast],
  );

  const handleEditUpdate = useCallback(
    async (draft: SetDraft) => {
      if (!editingSet) return;
      const exercise = exerciseById.get(editingSet.exerciseId);
      if (!exercise) return;
      const perSide =
        exercise.type === "barbell" || exercise.type === "dumbbell"
          ? exercise.perSide ?? true
          : false;
      const totals = computeTotals(
        draft.inputLb,
        exercise.type,
        editingSet.barLbSnapshot,
        settings.roundingKg,
        perSide,
      );
      const updated: SetEntry = {
        ...editingSet,
        inputLb: draft.inputLb,
        reps: draft.reps,
        totalLb: totals.totalLb,
        totalKg: totals.totalKg,
        note: draft.note || undefined,
        tags: draft.tags.length ? draft.tags : undefined,
        meta: draft.rpe ? { rpe: draft.rpe } : undefined,
      };
      await updateSet(updated);
      setSets((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingSet(null);
      showToast(`Updated ${formatSetLabel(updated, exercise)}`);
    },
    [editingSet, exerciseById, formatSetLabel, settings.roundingKg, showToast],
  );

  const handleEditDelete = useCallback(async () => {
    if (!editingSet) return;
    const exercise = exerciseById.get(editingSet.exerciseId);
    await deleteSet(editingSet.id);
    setSets((prev) => {
      const next = prev.filter((item) => item.id !== editingSet.id);
      const stillHasDate = next.some((item) => item.date === editingSet.date);
      if (!stillHasDate) {
        removeSessionDate(editingSet.date);
      }
      return next;
    });
    setEditingSet(null);
    if (exercise) {
      showToast(`Deleted ${formatSetLabel(editingSet, exercise)}`, async () => {
        await addSet(editingSet);
        setSets((prev) => [editingSet, ...prev]);
        await refreshSessionDate(editingSet.date);
      });
    } else {
      showToast("Deleted set");
    }
  }, [
    editingSet,
    exerciseById,
    formatSetLabel,
    refreshSessionDate,
    removeSessionDate,
    showToast,
  ]);

  const handleDeleteSet = useCallback(
    async (entry: SetEntry) => {
      await deleteSet(entry.id);
      setSets((prev) => {
        const next = prev.filter((item) => item.id !== entry.id);
        const stillHasDate = next.some((item) => item.date === entry.date);
        if (!stillHasDate) {
          removeSessionDate(entry.date);
        }
        return next;
      });
      const exercise = exerciseById.get(entry.exerciseId);
      if (exercise) {
        showToast(`Deleted ${formatSetLabel(entry, exercise)}`, async () => {
          await addSet(entry);
          setSets((prev) => [entry, ...prev]);
          await refreshSessionDate(entry.date);
        });
      } else {
        showToast("Deleted set");
      }
    },
    [exerciseById, formatSetLabel, refreshSessionDate, removeSessionDate, showToast],
  );

  const handleToggleWarmup = useCallback(
    async (entry: SetEntry) => {
      const nextTags = new Set(entry.tags ?? []);
      if (nextTags.has("warmup")) {
        nextTags.delete("warmup");
      } else {
        nextTags.add("warmup");
      }
      const updated: SetEntry = {
        ...entry,
        tags: nextTags.size ? Array.from(nextTags) : undefined,
      };
      await updateSet(updated);
      setSets((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    },
    [],
  );

  const suggestedSet = useMemo(() => {
    if (!activeExercise) return null;
    const repPresets = [...settings.repPresets].sort((a, b) => a - b);
    const repCeiling = repPresets[repPresets.length - 1] ?? 12;
    const repDrop = repPresets[Math.max(0, repPresets.length - 3)] ?? 8;
    const baseReps = lastSet?.reps ?? repPresets[1] ?? 8;
    const baseWeight =
      activeExercise.type === "bodyweight"
        ? 0
        : lastSet?.inputLb ?? settings.weightPresets[2] ?? settings.barLb;
    if (!lastSet) {
      return {
        inputLb: baseWeight,
        reps: baseReps,
        recommended: false,
      };
    }
    if (activeExercise.type === "bodyweight") {
      const shouldProgress = lastSet.reps >= repCeiling;
      return {
        inputLb: 0,
        reps: shouldProgress ? lastSet.reps + 1 : lastSet.reps,
        recommended: shouldProgress,
      };
    }
    const shouldProgress = lastSet.reps >= repCeiling;
    return {
      inputLb: shouldProgress ? lastSet.inputLb + getWeightStep(activeExercise) : lastSet.inputLb,
      reps: shouldProgress ? repDrop : lastSet.reps,
      recommended: shouldProgress,
    };
  }, [activeExercise, lastSet, settings.barLb, settings.repPresets, settings.weightPresets]);

  const handleLogPrimary = useCallback(
    async (count = 1) => {
      if (!activeExercise || !suggestedSet) return;
      for (let i = 0; i < count; i += 1) {
        await handleAddSet(
          activeExercise,
          {
            inputLb: suggestedSet.inputLb,
            reps: suggestedSet.reps,
            tags: [],
            note: "",
          },
          { silent: i < count - 1 },
        );
      }
    },
    [activeExercise, handleAddSet, suggestedSet],
  );

  const startRestTimer = useCallback(() => {
    setRestTimerEndsAt(Date.now() + 90 * 1000);
    setRestTick(Date.now());
  }, []);

  useEffect(() => {
    if (!restTimerEndsAt) return;
    const id = window.setInterval(() => setRestTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [restTimerEndsAt]);

  const restRemaining = restTimerEndsAt
    ? Math.max(0, Math.ceil((restTimerEndsAt - restTick) / 1000))
    : 0;

  useEffect(() => {
    if (!restTimerEndsAt) return;
    if (restRemaining === 0) {
      setRestTimerEndsAt(null);
      showToast("Rest complete.");
    }
  }, [restRemaining, restTimerEndsAt, showToast]);

  const handleScroll = useCallback(() => {
    if (scrollRaf.current) return;
    scrollRaf.current = window.requestAnimationFrame(() => {
      scrollRaf.current = null;
      const node = carouselRef.current;
      if (!node) return;
      const width = node.clientWidth;
      if (!width) return;
      const nextIndex = Math.round(node.scrollLeft / width);
      setActiveIndex((prev) => (prev === nextIndex ? prev : nextIndex));
    });
  }, []);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (!activeExercise) return;
      gestureRef.current.active = true;
      gestureRef.current.triggered = false;
      gestureRef.current.skipClick = false;
      gestureRef.current.startX = event.clientX;
      gestureRef.current.startY = event.clientY;
      if (gestureRef.current.longPressTimer) {
        window.clearTimeout(gestureRef.current.longPressTimer);
      }
      gestureRef.current.longPressTimer = window.setTimeout(() => {
        gestureRef.current.triggered = true;
        gestureRef.current.skipClick = true;
        if (suggestedSet) {
          setComposerSeed({ inputLb: suggestedSet.inputLb, reps: suggestedSet.reps });
        }
        setComposerOpen(true);
      }, 520);
    },
    [activeExercise, suggestedSet],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (!gestureRef.current.active || gestureRef.current.triggered) return;
      const dx = event.clientX - gestureRef.current.startX;
      const dy = event.clientY - gestureRef.current.startY;
      const threshold = 32;
      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
      if (gestureRef.current.longPressTimer) {
        window.clearTimeout(gestureRef.current.longPressTimer);
        gestureRef.current.longPressTimer = null;
      }
      gestureRef.current.triggered = true;
      gestureRef.current.skipClick = true;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > threshold) {
          startRestTimer();
        } else if (dx < -threshold && activeExercise) {
          void handleUndoToday(activeExercise.id);
        }
      } else if (dy < -threshold) {
        void handleLogPrimary(2);
      }
    },
    [activeExercise, handleLogPrimary, handleUndoToday, startRestTimer],
  );

  const handlePointerUp = useCallback(() => {
    gestureRef.current.active = false;
    if (gestureRef.current.longPressTimer) {
      window.clearTimeout(gestureRef.current.longPressTimer);
      gestureRef.current.longPressTimer = null;
    }
  }, []);

  const handlePrimaryClick = useCallback(async () => {
    if (gestureRef.current.skipClick) {
      gestureRef.current.skipClick = false;
      return;
    }
    await handleLogPrimary();
  }, [handleLogPrimary]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[color:var(--muted)]">
        Loading gym log...
      </div>
    );
  }

  const prevExercise = exercisesForWorkout[activeIndex - 1] ?? null;
  const nextExercise = exercisesForWorkout[activeIndex + 1] ?? null;

  const nextLabel =
    activeExercise && suggestedSet
      ? activeExercise.type === "bodyweight"
        ? `BWx${suggestedSet.reps}`
        : `${formatLb(suggestedSet.inputLb)}x${suggestedSet.reps}`
      : "--";
  const primaryLabel =
    activeExercise && suggestedSet
      ? `+ ${nextLabel}`
      : "+ Log set";

  return (
    <>
      <AppShell
        title="Log"
        mainClassName="pt-4"
        header={
          <div className="space-y-3 px-5 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="-mx-5 flex flex-1 gap-2 overflow-x-auto px-5 pb-1">
                {sessionBarDates.map((dateKey) => {
                  const isActive = dateKey === activeSessionDate;
                  const label =
                    dateKey === todayKey ? "Today" : formatDateHeading(dateKey);
                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => updateSessionDate(dateKey)}
                      className={`min-h-[36px] whitespace-nowrap rounded-full border px-3 text-[10px] uppercase tracking-[0.3em] transition ${
                        isActive
                          ? "border-[var(--accent)] bg-[color:var(--accent)] text-[color:var(--accent-ink)]"
                          : "border-[var(--border)] bg-[color:var(--bg-card)] text-[color:var(--muted)]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={openCalendar}
                  className="min-h-[36px] whitespace-nowrap rounded-full border border-[var(--border)] bg-[color:var(--bg-card)] px-3 text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]"
                >
                  Pick
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden min-h-[36px] items-center rounded-full border border-[var(--border)] bg-[color:var(--bg-card)] px-3 text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)] sm:flex">
                  Sync ✓
                </div>
                <Link
                  href="/settings"
                  className="grid h-11 w-11 place-items-center rounded-full border border-[var(--border)] bg-[color:var(--bg-card)]"
                  aria-label="Settings"
                >
                  <IconSettings className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSessionPickerOpen(true)}
              className="flex min-h-[44px] w-full items-center gap-2 rounded-full border border-[var(--border)] bg-[color:var(--bg-card)] px-4 py-2 text-left"
            >
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
                  Workout {activeWorkout} · {sessionDateLabel}
                </div>
                <div className="truncate text-sm font-semibold text-[color:var(--text)]">
                  {activeMeta?.focus ? `${activeMeta.focus} Focus` : "Session"}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
                  {activeSetCount} sets · {activeCompleted}/{activeMeta?.total ?? 0} complete
                </div>
              </div>
              <IconChevronDown className="h-4 w-4 text-[color:var(--muted)]" />
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {activeExercise ? (
            <div className="flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
              <span className="max-w-[30%] truncate">
                {prevExercise ? `← ${prevExercise.name}` : ""}
              </span>
              <span className="max-w-[40%] truncate text-[color:var(--text)]">
                {activeExercise.name}
              </span>
              <span className="max-w-[30%] truncate text-right">
                {nextExercise ? `${nextExercise.name} →` : ""}
              </span>
            </div>
          ) : null}

          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
          >
            {exercisesForWorkout.map((exercise) => {
              const isActive = exercise.id === activeExercise?.id;
              const exerciseLastSet = lastSetByExercise.get(exercise.id) ?? null;
              const exerciseSuggested =
                isActive && suggestedSet
                  ? suggestedSet
                  : exerciseLastSet
                    ? {
                        inputLb: exerciseLastSet.inputLb,
                        reps: exerciseLastSet.reps,
                        recommended: false,
                      }
                    : null;
              const lastLabelLocal = exerciseLastSet
                ? formatSetLabel(exerciseLastSet, exercise)
                : "--";
              const nextLabelLocal = exerciseSuggested
                ? exercise.type === "bodyweight"
                  ? `BWx${exerciseSuggested.reps}`
                  : `${formatLb(exerciseSuggested.inputLb)}x${exerciseSuggested.reps}`
                : "--";
              const targetDelta =
                exerciseLastSet && exerciseSuggested
                  ? exerciseSuggested.inputLb - exerciseLastSet.inputLb
                  : 0;

              return (
                <div key={exercise.id} className="min-w-full snap-start px-1">
                  <div
                    className={`rounded-[var(--radius-lg)] border border-[var(--border)] bg-[color:var(--bg-card)] p-5 shadow-[var(--shadow)] ${
                      isActive ? "animate-[rise-in_0.35s_ease-out]" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.4em] text-[color:var(--muted)]">
                          {typeLabel(exercise.type)} • {getModeLabel(exercise)}
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-[color:var(--text)] font-serif">
                          {exercise.name}
                        </div>
                        <div className="mt-2 text-xs text-[color:var(--muted)]">
                          Last {lastLabelLocal}
                          {exerciseLastSet && exerciseSuggested ? (
                            <>
                              <span className="mx-2">·</span>
                              {targetDelta > 0
                                ? `Target +${formatLb(targetDelta)} lb`
                                : `Next ${nextLabelLocal}`}
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {isActive ? (
                      <div className="mt-6 space-y-4">
                        <button
                          type="button"
                          onClick={handlePrimaryClick}
                          onPointerDown={handlePointerDown}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          onPointerLeave={handlePointerUp}
                          onPointerCancel={handlePointerUp}
                          className="flex min-h-[72px] w-full items-center justify-center rounded-[26px] bg-[color:var(--accent)] px-4 text-lg font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-ink)]"
                          style={{ touchAction: "none" }}
                          aria-label="Log set"
                        >
                          {primaryLabel}
                        </button>
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[color:var(--muted)]">
                          <span>Swipe up: log x2 · Swipe left: undo</span>
                          <span>Swipe right: rest · Long press: edit</span>
                        </div>

                        {restTimerEndsAt ? (
                          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] px-4 py-3">
                            <div className="flex items-center gap-2 text-sm text-[color:var(--text)]">
                              <IconTimer className="h-4 w-4" />
                              Rest {Math.floor(restRemaining / 60)}:
                              {String(restRemaining % 60).padStart(2, "0")}
                            </div>
                            <button
                              type="button"
                              onClick={() => setRestTimerEndsAt(null)}
                              className="min-h-[44px] rounded-full border border-[var(--border)] px-3 text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]"
                            >
                              Stop
                            </button>
                          </div>
                        ) : null}

                        <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-4">
                          <div className="text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
                            Timeline
                          </div>
                          <div className="mt-3 max-h-[220px] space-y-2 overflow-y-auto">
                            {sessionSets.length ? (
                              sessionSets.map((setEntry) => {
                                const warmup = setEntry.tags?.includes("warmup");
                                return (
                                  <div
                                    key={setEntry.id}
                                    className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[color:var(--bg-card)] animate-[fade-in_0.25s_ease-out]"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setEditingSet(setEntry)}
                                      className="flex min-h-[56px] flex-1 items-center gap-3 px-4 py-2 text-left"
                                    >
                                      <span className="h-2 w-2 rounded-full bg-[color:var(--accent)]" />
                                      <div>
                                        <div className="text-sm font-semibold text-[color:var(--text)] font-mono">
                                          {formatSetLabel(setEntry, exercise)}
                                        </div>
                                        <div className="text-xs text-[color:var(--muted)]">
                                          {formatShortTime(setEntry.ts)}
                                        </div>
                                      </div>
                                      {warmup ? (
                                        <span className="ml-auto rounded-full border border-[var(--border)] bg-[color:var(--chip)] px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
                                          Warmup
                                        </span>
                                      ) : null}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleWarmup(setEntry)}
                                      className="grid h-11 w-11 place-items-center rounded-full border border-[var(--border)] text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]"
                                    >
                                      W
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSet(setEntry)}
                                      className="grid h-11 w-11 place-items-center rounded-full border border-[var(--border)] text-[10px] uppercase tracking-[0.3em] text-[color:var(--danger)]"
                                    >
                                      Del
                                    </button>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-center text-sm text-[color:var(--muted)]">
                                No sets yet. Tap to log the first.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 text-xs text-[color:var(--muted)]">
                        Swipe here to focus this exercise.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!exercisesForWorkout.length ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] p-6 text-center text-sm text-[color:var(--muted)]">
              No exercises in this workout yet. Add some in Settings.
            </div>
          ) : null}
        </div>
      </AppShell>

      <BottomSheet
        open={sessionPickerOpen}
        onClose={() => setSessionPickerOpen(false)}
        title="Session picker"
      >
        <div className="space-y-3">
          {workoutMeta.map((meta) => {
            const active = meta.workout === activeWorkout;
            return (
              <button
                key={meta.workout}
                type="button"
                onClick={() => {
                  setSelectedWorkout(meta.workout);
                  setSessionPickerOpen(false);
                }}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  active
                    ? "border-[var(--accent)] bg-[color:var(--accent)] text-[color:var(--accent-ink)]"
                    : "border-[var(--border)] bg-[color:var(--bg-elev)] text-[color:var(--text)]"
                }`}
              >
                <div className="text-[10px] uppercase tracking-[0.35em] opacity-80">
                  Workout {meta.workout}
                </div>
                <div className="mt-2 text-sm">
                  {meta.focus ? `Focus: ${meta.focus}` : "No focus yet"}
                </div>
                <div className="mt-2 text-[10px] uppercase tracking-[0.3em] opacity-80">
                  {meta.setCount} sets · {meta.completed}/{meta.total || 0} complete
                </div>
              </button>
            );
          })}
          <Link
            href="/settings"
            onClick={() => setSessionPickerOpen(false)}
            className="block rounded-2xl border border-dashed border-[var(--border)] px-4 py-3 text-center text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]"
          >
            + New workout
          </Link>
        </div>
      </BottomSheet>

      <BottomSheet
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        title="Pick session date"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="min-h-[36px] rounded-full border border-[var(--border)] px-3 text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]"
            >
              Prev
            </button>
            <div className="text-sm font-semibold text-[color:var(--text)] font-serif">
              {calendarMonthLabel}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="min-h-[36px] rounded-full border border-[var(--border)] px-3 text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]"
            >
              Next
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} />;
              }
              return (
                <button
                  key={day.dateKey}
                  type="button"
                  onClick={() => {
                    updateSessionDate(day.dateKey);
                    setCalendarOpen(false);
                  }}
                  className={`flex min-h-[44px] flex-col items-center justify-center rounded-2xl border px-2 py-2 text-xs font-semibold transition ${
                    day.isActive
                      ? "border-[var(--accent)] bg-[color:var(--accent)] text-[color:var(--accent-ink)]"
                      : "border-[var(--border)] bg-[color:var(--bg-elev)] text-[color:var(--text)]"
                  }`}
                >
                  <span>{day.day}</span>
                  <span
                    className={`mt-1 h-1 w-1 rounded-full ${
                      day.hasWorkout
                        ? "bg-[color:var(--accent-2)]"
                        : day.isToday
                          ? "bg-[color:var(--accent)]"
                          : "bg-transparent"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
          <div className="text-xs text-[color:var(--muted)]">
            Dots mark days with a logged workout.
          </div>
        </div>
      </BottomSheet>

      <SetComposer
        open={composerOpen}
        exercise={activeExercise}
        settings={settings}
        seed={composerSeed}
        onClose={() => {
          setComposerOpen(false);
          setComposerSeed(null);
        }}
        onSave={(draft) => {
          if (!activeExercise) return;
          handleAddSet(activeExercise, draft);
          setComposerOpen(false);
          setComposerSeed(null);
        }}
      />

      <SetComposer
        open={Boolean(editingSet)}
        mode="edit"
        exercise={
          editingSet
            ? exerciseById.get(editingSet.exerciseId) ?? null
            : null
        }
        settings={
          editingSet
            ? { ...settings, barLb: editingSet.barLbSnapshot }
            : settings
        }
        initial={editingSet}
        onClose={() => setEditingSet(null)}
        onSave={handleEditUpdate}
        onDelete={handleEditDelete}
      />

      <Onboarding
        open={needsOnboarding}
        defaultBarLb={settings.barLb}
        onComplete={handleOnboardingComplete}
      />

      {toast ? (
        <Toast
          message={toast.message}
          actionLabel={toast.action ? "Undo" : undefined}
          onAction={() => {
            toast.action?.();
            setToast(null);
          }}
          onClose={() => setToast(null)}
        />
      ) : null}
    </>
  );
};

export default LogPage;
