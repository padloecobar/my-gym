"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";
import ExerciseCard from "../components/ExerciseCard";
import Onboarding from "../components/Onboarding";
import SetBuilder from "../components/SetBuilder";
import Toast from "../components/Toast";
import { IconSettings, IconSwap } from "../components/Icons";
import {
  addSet,
  deleteSet,
  getAllExercises,
  getAllSettings,
  getAllSets,
  saveExercises,
  setSettings,
  updateSet,
} from "../lib/db";
import { computeTotals, formatLb } from "../lib/calc";
import { getLocalDateKey } from "../lib/date";
import {
  createDefaultExercises,
  defaultSettings,
} from "../lib/defaults";
import type { Exercise, SetEntry, SettingsState, WorkoutId } from "../lib/types";

const LogPage = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sets, setSets] = useState<SetEntry[]>([]);
  const [settings, setSettingsState] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [toast, setToast] = useState<{ message: string; action?: () => void } | null>(
    null,
  );
  const toastTimer = useRef<number | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutId | null>(null);
  const [editingSet, setEditingSet] = useState<SetEntry | null>(null);
  const [highlightSetId, setHighlightSetId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [exerciseData, settingsData, setData] = await Promise.all([
          getAllExercises(),
          getAllSettings(),
          getAllSets(),
        ]);
        const mergedSettings = {
          ...defaultSettings,
          ...settingsData,
        } as SettingsState;
        setExercises(exerciseData);
        setSettingsState(mergedSettings);
        setSets(setData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const suggestedWorkout = useMemo<WorkoutId>(() => {
    const lastWorkout = settings.lastWorkout;
    return !lastWorkout ? "A" : lastWorkout === "A" ? "B" : "A";
  }, [settings.lastWorkout]);

  useEffect(() => {
    if (selectedWorkout === null) {
      setSelectedWorkout(suggestedWorkout);
    }
  }, [selectedWorkout, suggestedWorkout]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!highlightSetId) return;
    const timer = window.setTimeout(() => setHighlightSetId(null), 2000);
    return () => window.clearTimeout(timer);
  }, [highlightSetId]);

  const needsOnboarding = !settings.onboarded || exercises.length === 0;

  const activeWorkout = selectedWorkout ?? suggestedWorkout;

  const todayKey = getLocalDateKey();

  const { lastSetByExercise, todaySetsByExercise } = useMemo(() => {
    const lastMap = new Map<string, SetEntry>();
    const todayMap = new Map<string, SetEntry[]>();
    sets.forEach((set) => {
      if (!lastMap.has(set.exerciseId)) {
        lastMap.set(set.exerciseId, set);
      }
      if (set.date === todayKey) {
        const list = todayMap.get(set.exerciseId) ?? [];
        list.push(set);
        todayMap.set(set.exerciseId, list);
      }
    });
    return { lastSetByExercise: lastMap, todaySetsByExercise: todayMap };
  }, [sets, todayKey]);

  const workouts = useMemo(() => {
    const hasCustom = exercises.some((exercise) => exercise.workout === "Custom");
    const base: WorkoutId[] = ["A", "B"];
    if (hasCustom) base.push("Custom");
    return base;
  }, [exercises]);

  const exercisesForWorkout = useMemo(() => {
    return exercises
      .filter((exercise) => exercise.workout === activeWorkout)
      .sort((a, b) => a.order - b.order);
  }, [activeWorkout, exercises]);

  const workoutMeta = useMemo(() => {
    return workouts.map((workout) => {
      const list = exercises
        .filter((exercise) => exercise.workout === workout)
        .sort((a, b) => a.order - b.order);
      const focus = list.slice(0, 2).map((exercise) => exercise.name).join(" + ");
      const completed = list.filter(
        (exercise) => (todaySetsByExercise.get(exercise.id) ?? []).length > 0,
      ).length;
      const setCount = list.reduce(
        (total, exercise) =>
          total + (todaySetsByExercise.get(exercise.id) ?? []).length,
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
  }, [exercises, todaySetsByExercise, workouts]);

  const activeMeta = workoutMeta.find((meta) => meta.workout === activeWorkout);
  const activeCompleted = activeMeta?.completed ?? 0;
  const activeSetCount = activeMeta?.setCount ?? 0;
  const progressPercent =
    exercisesForWorkout.length > 0
      ? Math.min(
          100,
          Math.round((activeCompleted / exercisesForWorkout.length) * 100),
        )
      : 0;

  const handleOnboardingComplete = async (barLb: number) => {
    const seeded = createDefaultExercises();
    const nextSettings: SettingsState = {
      ...defaultSettings,
      barLb,
      onboarded: true,
    };
    await saveExercises(seeded);
    await setSettings(nextSettings);
    setExercises(seeded);
    setSettingsState(nextSettings);
  };

  const showToast = (message: string, action?: () => void) => {
    setToast({ message, action });
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  };

  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof navigator === "undefined") return;
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const formatSetLabel = (entry: SetEntry, exercise: Exercise) =>
    exercise.type === "bodyweight"
      ? `BWx${entry.reps}`
      : `${formatLb(entry.inputLb)}x${entry.reps}`;

  const createSetEntry = (
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
    const totals = computeTotals(
      draft.inputLb,
      exercise.type,
      barLbSnapshot,
      settings.roundingKg,
    );
    return {
      id: crypto.randomUUID(),
      ts,
      date: getLocalDateKey(ts),
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
  };

  const handleAddSet = async (
    exercise: Exercise,
    draft: {
      inputLb: number;
      reps: number;
      tags: string[];
      note: string;
      rpe?: number;
    },
  ) => {
    const entry = createSetEntry(exercise, draft);
    try {
      await addSet(entry);
      setSets((prev) => [entry, ...prev]);
      setHighlightSetId(entry.id);
      if (exercise.workout === "A" || exercise.workout === "B") {
        const nextSettings = { ...settings, lastWorkout: exercise.workout };
        setSettingsState(nextSettings);
        await setSettings({ lastWorkout: exercise.workout });
      }
      triggerHaptic(8);
      showToast(`Logged ${formatSetLabel(entry, exercise)}`, async () => {
        await deleteSet(entry.id);
        setSets((prev) => prev.filter((item) => item.id !== entry.id));
      });
    } catch (error) {
      console.error(error);
      showToast("Could not save set");
    }
  };

  const handleQuickAddMany = async (exercise: Exercise, drafts: Array<{ inputLb: number; reps: number }>) => {
    for (const draft of drafts) {
      await handleAddSet(exercise, {
        inputLb: draft.inputLb,
        reps: draft.reps,
        tags: [],
        note: "",
      });
    }
  };

  const handleUndoToday = async (exerciseId: string) => {
    const todaySets = todaySetsByExercise.get(exerciseId) ?? [];
    const latest = todaySets[0];
    if (!latest) return;
    await deleteSet(latest.id);
    setSets((prev) => prev.filter((item) => item.id !== latest.id));
  };

  const handleEdit = (setEntry: SetEntry) => {
    setEditingSet(setEntry);
    setBuilderOpen(false);
  };

  const handleEditUpdate = async (draft: {
    inputLb: number;
    reps: number;
    tags: string[];
    note: string;
    rpe?: number;
  }) => {
    if (!editingSet) return;
    const exercise = exercises.find((item) => item.id === editingSet.exerciseId);
    if (!exercise) return;
    const totals = computeTotals(
      draft.inputLb,
      exercise.type,
      editingSet.barLbSnapshot,
      settings.roundingKg,
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
  };

  const handleEditDelete = async () => {
    if (!editingSet) return;
    const exercise = exercises.find((item) => item.id === editingSet.exerciseId);
    await deleteSet(editingSet.id);
    setSets((prev) => prev.filter((item) => item.id !== editingSet.id));
    setEditingSet(null);
    if (exercise) {
      showToast(`Deleted ${formatSetLabel(editingSet, exercise)}`, async () => {
        await addSet(editingSet);
        setSets((prev) => [editingSet, ...prev]);
      });
    } else {
      showToast("Deleted set");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[color:var(--muted)]">
        Loading gym log...
      </div>
    );
  }

  return (
    <>
      <AppShell
        title="Log"
        headerRight={
          <Link
            href="/settings"
            className="grid h-11 w-11 place-items-center rounded-full border border-[var(--border)] bg-[color:var(--bg-card)]"
          >
            <IconSettings className="h-4 w-4" />
          </Link>
        }
      >
        <div className="space-y-5">
          <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[color:var(--bg-card)] p-5 shadow-[var(--shadow)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)] font-mono">
                  Session
                </div>
                <div className="mt-2 text-2xl font-semibold text-[color:var(--text)] font-serif">
                  Workout {activeWorkout}
                </div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">
                  {activeMeta?.focus ? `Focus: ${activeMeta.focus}` : "No focus yet"}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-[color:var(--muted)]">
                  Suggested based on last workout
                  <IconSwap className="h-3 w-3" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
                    Sets
                  </div>
                  <div className="mt-1 text-lg font-semibold text-[color:var(--text)] font-mono">
                    {activeSetCount}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
                    Progress
                  </div>
                  <div className="mt-1 text-lg font-semibold text-[color:var(--text)] font-mono">
                    {activeCompleted}/{exercisesForWorkout.length}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 w-full rounded-full bg-[color:var(--chip)]">
                <div
                  className="h-full rounded-full bg-[color:var(--accent-2)] transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
                {progressPercent}% of exercises logged
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
              <span>Session selector</span>
              <span>{workoutMeta.length} options</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {workoutMeta.map((meta) => {
                const active = meta.workout === activeWorkout;
                return (
                  <button
                    key={meta.workout}
                    type="button"
                    onClick={() => setSelectedWorkout(meta.workout)}
                    className={`rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-3 text-left transition ${
                      active
                        ? "bg-[color:var(--accent)] text-[color:var(--accent-ink)] shadow-[var(--shadow)]"
                        : "bg-[color:var(--bg-card)] text-[color:var(--text)]"
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-[0.35em] opacity-80">
                      Workout {meta.workout}
                    </div>
                    <div className="mt-2 text-xs">
                      {meta.focus ? `Focus: ${meta.focus}` : "No exercises yet"}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] opacity-80">
                      <span>
                        {meta.completed}/{meta.total || 0} done
                      </span>
                      <span>{meta.setCount} sets</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
              <span>Deck</span>
              <span>{exercisesForWorkout.length} moves</span>
            </div>
            {exercisesForWorkout.map((exercise) => {
              const lastSet = lastSetByExercise.get(exercise.id) ?? null;
              const todaySets = todaySetsByExercise.get(exercise.id) ?? [];
              return (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  lastSet={lastSet}
                  todaySets={todaySets}
                  settings={settings}
                  onAddSet={() => {
                    setActiveExercise(exercise);
                    setBuilderOpen(true);
                  }}
                  onSame={() => {
                    if (!lastSet) return;
                    handleAddSet(exercise, {
                      inputLb: lastSet.inputLb,
                      reps: lastSet.reps,
                      tags: lastSet.tags ?? [],
                      note: "",
                      rpe: lastSet.meta?.rpe,
                    });
                  }}
                  onSameDouble={() => {
                    if (!lastSet) return;
                    handleAddSet(exercise, {
                      inputLb: lastSet.inputLb,
                      reps: lastSet.reps,
                      tags: lastSet.tags ?? [],
                      note: "",
                      rpe: lastSet.meta?.rpe,
                    });
                    handleAddSet(exercise, {
                      inputLb: lastSet.inputLb,
                      reps: lastSet.reps,
                      tags: lastSet.tags ?? [],
                      note: "",
                      rpe: lastSet.meta?.rpe,
                    });
                  }}
                  onUndoLast={() => handleUndoToday(exercise.id)}
                  onEditSet={handleEdit}
                  highlightSetId={highlightSetId}
                />
              );
            })}
            {exercisesForWorkout.length === 0 ? (
              <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-transparent p-6 text-center text-sm text-[color:var(--muted)]">
                No exercises in this workout yet. Add some in Settings.
              </div>
            ) : null}
          </section>
        </div>
      </AppShell>

      <SetBuilder
        open={builderOpen}
        exercise={activeExercise}
        settings={settings}
        lastSet={activeExercise ? lastSetByExercise.get(activeExercise.id) : null}
        onClose={() => setBuilderOpen(false)}
        onSave={(draft) => {
          if (!activeExercise) return;
          handleAddSet(activeExercise, draft);
          setBuilderOpen(false);
        }}
        onQuickSave={(draft) => {
          if (!activeExercise) return;
          handleAddSet(activeExercise, draft);
        }}
        onSaveMany={(drafts) => {
          if (!activeExercise) return;
          handleQuickAddMany(activeExercise, drafts);
        }}
      />

      <SetBuilder
        open={Boolean(editingSet)}
        mode="edit"
        exercise={
          editingSet
            ? exercises.find((exercise) => exercise.id === editingSet.exerciseId) ??
              null
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
