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
  getAllExercises,
  getAllSettings,
  getAllSets,
  saveExercises,
  setSettings,
} from "../lib/db";
import { computeTotals } from "../lib/calc";
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
      if (exercise.workout === "A" || exercise.workout === "B") {
        const nextSettings = { ...settings, lastWorkout: exercise.workout };
        setSettingsState(nextSettings);
        await setSettings({ lastWorkout: exercise.workout });
      }
      showToast("Saved - Undo", async () => {
        const { deleteSet } = await import("../lib/db");
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
    const { deleteSet } = await import("../lib/db");
    await deleteSet(latest.id);
    setSets((prev) => prev.filter((item) => item.id !== latest.id));
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
            className="grid h-10 w-10 place-items-center rounded-full border border-[var(--border)]"
          >
            <IconSettings className="h-4 w-4" />
          </Link>
        }
      >
        <div className="space-y-5">
          <section className="rounded-3xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--muted)]">
                  Today
                </div>
                <div className="mt-1 text-2xl font-semibold text-[color:var(--text)]">
                  Workout {activeWorkout}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-[color:var(--muted)]">
                  Suggested based on last workout
                  <IconSwap className="h-3 w-3" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 rounded-full border border-[var(--border)] bg-[color:var(--bg-card)] p-1">
                {workouts.map((workout) => (
                  <button
                    key={workout}
                    type="button"
                    onClick={() => setSelectedWorkout(workout)}
                    className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.3em] ${
                      selectedWorkout === workout
                        ? "bg-[color:var(--accent)] text-black"
                        : "text-[color:var(--muted)]"
                    }`}
                  >
                    {workout}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            {exercises
              .filter((exercise) => exercise.workout === activeWorkout)
              .sort((a, b) => a.order - b.order)
              .map((exercise) => {
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
                  />
                );
              })}
            {exercises.filter((exercise) => exercise.workout === activeWorkout)
              .length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--border)] bg-transparent p-6 text-center text-sm text-[color:var(--muted)]">
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
