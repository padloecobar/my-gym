"use client";

import { useEffect, useRef, useState } from "react";
import AppShell from "../../components/AppShell";
import Chip from "../../components/Chip";
import Stepper from "../../components/Stepper";
import Toast from "../../components/Toast";
import { IconDownload, IconDrag, IconUpload } from "../../components/Icons";
import {
  addSet,
  deleteExercise,
  getAllExercises,
  getAllSettings,
  getAllSets,
  saveExercise,
  saveExercises,
  setSettings,
} from "../../lib/db";
import { computeTotals } from "../../lib/calc";
import { getLocalDateKey } from "../../lib/date";
import {
  DEFAULT_REP_PRESETS,
  DEFAULT_WEIGHT_PRESETS,
  defaultSettings,
} from "../../lib/defaults";
import {
  parseBackup,
  parseSetsCsv,
  serializeBackup,
  serializeSetsCsv,
} from "../../lib/backup";
import type {
  Exercise,
  ExerciseType,
  SetEntry,
  SettingsState,
  WorkoutId,
} from "../../lib/types";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const workoutOptions: WorkoutId[] = ["A", "B", "Custom"];
const typeOptions: ExerciseType[] = [
  "barbell",
  "dumbbell",
  "machine",
  "bodyweight",
];

const SettingsPage = () => {
  const [settings, setSettingsState] = useState<SettingsState>(defaultSettings);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sets, setSets] = useState<SetEntry[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseType, setNewExerciseType] = useState<ExerciseType>("barbell");
  const [newExerciseWorkout, setNewExerciseWorkout] = useState<WorkoutId>("A");
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [settingsData, exerciseData, setData] = await Promise.all([
        getAllSettings(),
        getAllExercises(),
        getAllSets(),
      ]);
      setSettingsState({ ...defaultSettings, ...settingsData } as SettingsState);
      setExercises(exerciseData);
      setSets(setData);
    };
    load();
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  };

  const updateSettings = async (updates: Partial<SettingsState>) => {
    const next = { ...settings, ...updates };
    setSettingsState(next);
    await setSettings(updates);
  };

  const handleExerciseUpdate = async (id: string, updates: Partial<Exercise>) => {
    const next = exercises.map((exercise) => {
      if (exercise.id !== id) return exercise;
      if (updates.workout && updates.workout !== exercise.workout) {
        const nextOrder = exercises.filter(
          (item) => item.workout === updates.workout,
        ).length;
        return { ...exercise, ...updates, order: nextOrder };
      }
      return { ...exercise, ...updates };
    });
    setExercises(next);
    const updated = next.find((exercise) => exercise.id === id);
    if (updated) await saveExercise(updated);
  };

  const handleAddExercise = async () => {
    if (!newExerciseName.trim()) return;
    const workoutList = exercises
      .filter((exercise) => exercise.workout === newExerciseWorkout)
      .sort((a, b) => a.order - b.order);
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name: newExerciseName.trim(),
      type: newExerciseType,
      workout: newExerciseWorkout,
      order: workoutList.length,
      createdAt: Date.now(),
    };
    const next = [...exercises, newExercise];
    setExercises(next);
    await saveExercise(newExercise);
    setNewExerciseName("");
  };

  const handleRemoveExercise = async (exercise: Exercise) => {
    await deleteExercise(exercise.id);
    setExercises((prev) => prev.filter((item) => item.id !== exercise.id));
    showToast("Exercise removed. Existing sets keep history.");
  };

  const handleDragStart = (id: string) => {
    setDragId(id);
  };

  const handleDrop = async (workout: WorkoutId, targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const workoutList = exercises
      .filter((exercise) => exercise.workout === workout)
      .sort((a, b) => a.order - b.order);
    const fromIndex = workoutList.findIndex((item) => item.id === dragId);
    const toIndex = workoutList.findIndex((item) => item.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const updated = [...workoutList];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    const reordered = exercises.map((exercise) => {
      if (exercise.workout !== workout) return exercise;
      const newIndex = updated.findIndex((item) => item.id === exercise.id);
      return { ...exercise, order: newIndex };
    });
    setExercises(reordered);
    await saveExercises(reordered);
    setDragId(null);
  };

  const downloadFile = (content: string, fileName: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = async () => {
    const payload = serializeBackup(exercises, sets, settings);
    downloadFile(payload, "gymlog-backup.json", "application/json");
  };

  const handleExportCsv = async () => {
    const payload = serializeSetsCsv(sets, exercises);
    downloadFile(payload, "gymlog-sets.csv", "text/csv");
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      if (file.name.endsWith(".json")) {
        const payload = parseBackup(text);
        const existingById = new Map(
          exercises.map((exercise) => [exercise.id, exercise]),
        );
        const mergedExercises = [...exercises];
        payload.exercises.forEach((exercise) => {
          if (!existingById.has(exercise.id)) {
            mergedExercises.push(exercise);
          }
        });
        setExercises(mergedExercises);
        await saveExercises(mergedExercises);
        for (const setEntry of payload.sets) {
          await addSet(setEntry);
        }
        setSettingsState({ ...settings, ...payload.settings, onboarded: true });
        await setSettings({ ...payload.settings, onboarded: true });
        setSets(await getAllSets());
        showToast("Backup imported.");
        return;
      }

      const rows = parseSetsCsv(text);
      if (!rows.length) {
        showToast("No rows found in CSV.");
        return;
      }
      const byName = new Map(
        exercises.map((exercise) => [exercise.name.toLowerCase(), exercise]),
      );
      let nextExercises = [...exercises];

      for (const row of rows) {
        const name = row.exercise?.trim();
        if (!name) continue;
        let exercise = byName.get(name.toLowerCase());
        if (!exercise) {
          const workoutList = nextExercises
            .filter((item) => item.workout === "Custom")
            .sort((a, b) => a.order - b.order);
          exercise = {
            id: crypto.randomUUID(),
            name,
            type: (row.type as ExerciseType) || "machine",
            workout: "Custom",
            order: workoutList.length,
            createdAt: Date.now(),
          };
          nextExercises = [...nextExercises, exercise];
          byName.set(name.toLowerCase(), exercise);
        }

        const ts = row.ts ?? Date.now();
        const barLbSnapshot = row.barLbSnapshot || settings.barLb;
        const totals = row.totalLb
          ? { totalLb: row.totalLb, totalKg: row.totalKg }
          : computeTotals(
              row.inputLb,
              exercise.type,
              barLbSnapshot,
              settings.roundingKg,
            );

        const setEntry = {
          id: crypto.randomUUID(),
          ts,
          date: row.date || getLocalDateKey(ts),
          exerciseId: exercise.id,
          reps: row.reps,
          inputLb: row.inputLb,
          barLbSnapshot,
          totalLb: totals.totalLb,
          totalKg: totals.totalKg,
          note: row.note || undefined,
          tags: row.tags?.length ? row.tags : undefined,
          meta: row.rpe ? { rpe: row.rpe } : undefined,
        };

        await addSet(setEntry);
      }

      await saveExercises(nextExercises);
      setExercises(nextExercises);
      setSets(await getAllSets());
      showToast("CSV imported.");
    } catch (error) {
      console.error(error);
      showToast("Import failed.");
    }
  };

  const groupedExercises = (workout: WorkoutId) =>
    exercises
      .filter((exercise) => exercise.workout === workout)
      .sort((a, b) => a.order - b.order);

  return (
    <AppShell title="Settings">
      <div className="space-y-5">
        <section className="rounded-3xl border border-[var(--border)] bg-[color:var(--bg-card)] p-5">
          <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--muted)]">
            Bar Weight
          </div>
          <div className="mt-3">
            <Stepper
              value={settings.barLb}
              onChange={(value) => updateSettings({ barLb: value })}
              step={5}
              min={10}
              max={70}
              label="Default bar (lb)"
            />
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-[color:var(--bg-card)] p-5">
          <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--muted)]">
            Display
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["both", "lb", "kg"] as const).map((unit) => (
              <Chip
                key={unit}
                selected={settings.unitDisplay === unit}
                onClick={() => updateSettings({ unitDisplay: unit })}
              >
                {unit.toUpperCase()}
              </Chip>
            ))}
          </div>
          <div className="mt-4">
            <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              KG rounding
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[0.1, 0.5, 1].map((value) => (
                <Chip
                  key={value}
                  selected={Math.abs(settings.roundingKg - value) < 0.01}
                  onClick={() => updateSettings({ roundingKg: value })}
                >
                  {value}kg
                </Chip>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              e1RM formula
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["epley", "brzycki"] as const).map((formula) => (
                <Chip
                  key={formula}
                  selected={settings.e1rmFormula === formula}
                  onClick={() => updateSettings({ e1rmFormula: formula })}
                >
                  {formula}
                </Chip>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-[color:var(--bg-card)] p-5">
          <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--muted)]">
            Presets
          </div>
          <div className="mt-3">
            <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              Weight presets
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {settings.weightPresets.map((value) => (
                <Chip
                  key={value}
                  onClick={() =>
                    updateSettings({
                      weightPresets: settings.weightPresets.filter(
                        (item) => item !== value,
                      ),
                    })
                  }
                >
                  {value}
                </Chip>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="number"
                min={0}
                placeholder="Add"
                className="w-full rounded-xl border border-[var(--border)] bg-[color:var(--bg-elev)] px-3 py-2 text-sm text-[color:var(--text)]"
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  const value = Number((event.target as HTMLInputElement).value);
                  if (!Number.isNaN(value)) {
                    updateSettings({
                      weightPresets: Array.from(
                        new Set([...settings.weightPresets, value]),
                      ).sort((a, b) => a - b),
                    });
                    (event.target as HTMLInputElement).value = "";
                  }
                }}
              />
              <button
                type="button"
                onClick={() =>
                  updateSettings({ weightPresets: DEFAULT_WEIGHT_PRESETS })
                }
                className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]"
              >
                Reset
              </button>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              Rep presets
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {settings.repPresets.map((value) => (
                <Chip
                  key={value}
                  onClick={() =>
                    updateSettings({
                      repPresets: settings.repPresets.filter((item) => item !== value),
                    })
                  }
                >
                  {value}
                </Chip>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="number"
                min={1}
                placeholder="Add"
                className="w-full rounded-xl border border-[var(--border)] bg-[color:var(--bg-elev)] px-3 py-2 text-sm text-[color:var(--text)]"
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  const value = Number((event.target as HTMLInputElement).value);
                  if (!Number.isNaN(value)) {
                    updateSettings({
                      repPresets: Array.from(
                        new Set([...settings.repPresets, value]),
                      ).sort((a, b) => a - b),
                    });
                    (event.target as HTMLInputElement).value = "";
                  }
                }}
              />
              <button
                type="button"
                onClick={() => updateSettings({ repPresets: DEFAULT_REP_PRESETS })}
                className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-[color:var(--bg-card)] p-5">
          <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--muted)]">
            Workout Editor
          </div>
          <div className="mt-4 grid gap-5">
            {workoutOptions.map((workout) => (
              <div key={workout} className="space-y-3">
                <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                  Workout {workout}
                </div>
                {groupedExercises(workout).map((exercise) => (
                  <div
                    key={exercise.id}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(workout, exercise.id)}
                    className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        draggable
                        onDragStart={() => handleDragStart(exercise.id)}
                        className="grid h-10 w-10 cursor-grab place-items-center rounded-full border border-[var(--border)] text-[color:var(--muted)]"
                      >
                        <IconDrag className="h-4 w-4" />
                      </div>
                      <input
                        defaultValue={exercise.name}
                        onBlur={(event) =>
                          handleExerciseUpdate(exercise.id, {
                            name: event.target.value,
                          })
                        }
                        className="w-full bg-transparent text-sm text-[color:var(--text)] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(exercise)}
                        className="text-xs uppercase tracking-[0.3em] text-[color:var(--danger)]"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={exercise.type}
                        onChange={(event) =>
                          handleExerciseUpdate(exercise.id, {
                            type: event.target.value as ExerciseType,
                          })
                        }
                        className="rounded-xl border border-[var(--border)] bg-[color:var(--bg-card)] px-3 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--text)]"
                      >
                        {typeOptions.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <select
                        value={exercise.workout}
                        onChange={(event) =>
                          handleExerciseUpdate(exercise.id, {
                            workout: event.target.value as WorkoutId,
                          })
                        }
                        className="rounded-xl border border-[var(--border)] bg-[color:var(--bg-card)] px-3 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--text)]"
                      >
                        {workoutOptions.map((workoutOption) => (
                          <option key={workoutOption} value={workoutOption}>
                            {workoutOption}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] p-4">
            <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              Add exercise
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <input
                value={newExerciseName}
                onChange={(event) => setNewExerciseName(event.target.value)}
                placeholder="Name"
                className="rounded-xl border border-[var(--border)] bg-[color:var(--bg-elev)] px-3 py-2 text-sm text-[color:var(--text)]"
              />
              <select
                value={newExerciseType}
                onChange={(event) =>
                  setNewExerciseType(event.target.value as ExerciseType)
                }
                className="rounded-xl border border-[var(--border)] bg-[color:var(--bg-elev)] px-3 py-2 text-sm text-[color:var(--text)]"
              >
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select
                value={newExerciseWorkout}
                onChange={(event) =>
                  setNewExerciseWorkout(event.target.value as WorkoutId)
                }
                className="rounded-xl border border-[var(--border)] bg-[color:var(--bg-elev)] px-3 py-2 text-sm text-[color:var(--text)]"
              >
                {workoutOptions.map((workout) => (
                  <option key={workout} value={workout}>
                    {workout}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddExercise}
              className="mt-3 w-full rounded-xl bg-[color:var(--accent)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black"
            >
              Add
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-[color:var(--bg-card)] p-5">
          <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--muted)]">
            Backup
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--text)]"
            >
              <IconDownload className="h-4 w-4" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--text)]"
            >
              <IconDownload className="h-4 w-4" />
              Export CSV
            </button>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--text)]">
              <IconUpload className="h-4 w-4" />
              Import
              <input
                type="file"
                accept=".json,.csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    handleImportFile(file);
                    event.target.value = "";
                  }
                }}
              />
            </label>
          </div>
        </section>

        {installPrompt ? (
          <section className="rounded-3xl border border-[var(--border)] bg-[color:var(--bg-card)] p-5">
            <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--muted)]">
              Install
            </div>
            <button
              type="button"
              onClick={async () => {
                await installPrompt.prompt();
                await installPrompt.userChoice;
                setInstallPrompt(null);
              }}
              className="mt-3 w-full rounded-xl bg-[color:var(--accent)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black"
            >
              Install App
            </button>
          </section>
        ) : null}
      </div>

      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </AppShell>
  );
};

export default SettingsPage;
