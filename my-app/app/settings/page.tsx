"use client";

import { useEffect, useRef, useState } from "react";
import AppShell from "../../components/AppShell";
import Chip from "../../components/Chip";
import Stepper from "../../components/Stepper";
import Toast from "../../components/Toast";
import {
  IconDrag,
  IconDownload,
  IconSearch,
  IconTrash,
  IconUpload,
} from "../../components/Icons";
import {
  addSet,
  deleteExercise,
  getAllExercises,
  getAllSessions,
  getAllSettings,
  getAllSets,
  saveExercise,
  saveExercises,
  saveSessions,
  setSettings,
} from "../../lib/db";
import { computeTotals } from "../../lib/calc";
import { formatShortTime, getLocalDateKey } from "../../lib/date";
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
import {
  disableFileMirror,
  enableFileMirror,
  getFileMirrorState,
  writeFileMirrorNow,
  type FileMirrorState,
} from "../../lib/fileMirror";
import type {
  Exercise,
  ExerciseType,
  SessionEntry,
  SetEntry,
  SettingsState,
  WorkoutId,
} from "../../lib/types";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type ExerciseTemplate = {
  name: string;
  type: ExerciseType;
  perSide?: boolean;
};

const workoutTabs: WorkoutId[] = ["A", "B", "Custom"];
const typeOptions: ExerciseType[] = [
  "barbell",
  "dumbbell",
  "machine",
  "bodyweight",
];

const EXERCISE_LIBRARY: ExerciseTemplate[] = [
  { name: "Bench Press", type: "barbell", perSide: true },
  { name: "Squat", type: "barbell", perSide: true },
  { name: "Deadlift", type: "barbell", perSide: true },
  { name: "Overhead Press", type: "barbell", perSide: true },
  { name: "Barbell Row", type: "barbell", perSide: true },
  { name: "Dumbbell Row", type: "dumbbell", perSide: true },
  { name: "Cable Row", type: "machine" },
  { name: "Machine Row", type: "machine" },
  { name: "Lat Pulldown", type: "machine" },
  { name: "Leg Press", type: "machine" },
  { name: "Leg Extension", type: "machine" },
  { name: "Chest Press", type: "machine" },
  { name: "Incline Bench", type: "barbell", perSide: true },
  { name: "Dips", type: "bodyweight" },
  { name: "Pull Up", type: "bodyweight" },
  { name: "Push Up", type: "bodyweight" },
];

const getNow = () => Date.now();

const SettingsPage = () => {
  const [settings, setSettingsState] = useState<SettingsState>(defaultSettings);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sets, setSets] = useState<SetEntry[]>([]);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [mirrorState, setMirrorState] = useState<FileMirrorState>({
    supported: false,
    enabled: false,
    fileName: null,
    lastWrite: null,
  });
  const [mirrorBusy, setMirrorBusy] = useState(false);

  const [activeWorkout, setActiveWorkout] = useState<WorkoutId>("A");
  const [searchTerm, setSearchTerm] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [settingsData, exerciseData, sessionData, setData, mirrorData] =
        await Promise.all([
          getAllSettings(),
          getAllExercises(),
          getAllSessions(),
          getAllSets(),
          getFileMirrorState(),
        ]);
      setSettingsState({ ...defaultSettings, ...settingsData } as SettingsState);
      setExercises(exerciseData);
      setSessions(sessionData);
      setSets(setData);
      setMirrorState(mirrorData);
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

  const refreshMirrorState = async () => {
    const next = await getFileMirrorState();
    setMirrorState(next);
    return next;
  };

  const handleEnableMirror = async () => {
    if (mirrorBusy) return;
    setMirrorBusy(true);
    const result = await enableFileMirror();
    if (!result.ok) {
      if (result.reason === "unsupported") {
        showToast("File mirror requires Chrome.");
      } else if (result.reason === "permission") {
        showToast("File permission denied.");
      } else if (result.reason !== "cancelled") {
        showToast("Could not enable file mirror.");
      }
      await refreshMirrorState();
      setMirrorBusy(false);
      return;
    }
    const writeResult = await writeFileMirrorNow();
    if (!writeResult.ok) {
      showToast("File mirror enabled, but write failed.");
    } else {
      showToast("File mirror enabled.");
    }
    await refreshMirrorState();
    setMirrorBusy(false);
  };

  const handleWriteMirror = async () => {
    if (mirrorBusy) return;
    setMirrorBusy(true);
    const result = await writeFileMirrorNow();
    if (!result.ok) {
      if (result.reason === "unsupported") {
        showToast("File mirror requires Chrome.");
      } else if (result.reason === "permission") {
        showToast("File permission denied.");
      } else if (result.reason === "not-enabled") {
        showToast("File mirror not enabled.");
      } else {
        showToast("Could not write mirror file.");
      }
    } else {
      showToast("Mirror updated.");
    }
    await refreshMirrorState();
    setMirrorBusy(false);
  };

  const handleDisableMirror = async () => {
    if (mirrorBusy) return;
    setMirrorBusy(true);
    await disableFileMirror();
    await refreshMirrorState();
    showToast("File mirror disabled.");
    setMirrorBusy(false);
  };

  const updateSettings = async (updates: Partial<SettingsState>) => {
    const next = { ...settings, ...updates };
    setSettingsState(next);
    await setSettings(updates);
  };

  const handleExerciseUpdate = async (id: string, updates: Partial<Exercise>) => {
    const next = exercises.map((exercise) => {
      if (exercise.id !== id) return exercise;
      let updated: Exercise = { ...exercise, ...updates };
      if (updates.type) {
        if (updates.type === "barbell" || updates.type === "dumbbell") {
          if (updated.perSide === undefined) updated.perSide = true;
        } else {
          updated.perSide = false;
        }
      }
      if (updates.workout && updates.workout !== exercise.workout) {
        const nextOrder = exercises.filter(
          (item) => item.workout === updates.workout,
        ).length;
        updated = { ...updated, order: nextOrder };
      }
      return updated;
    });
    setExercises(next);
    const updated = next.find((exercise) => exercise.id === id);
    if (updated) await saveExercise(updated);
  };

  const handleAddExercise = async (
    name: string,
    type: ExerciseType,
    perSide?: boolean,
  ) => {
    const workoutList = exercises
      .filter((exercise) => exercise.workout === activeWorkout)
      .sort((a, b) => a.order - b.order);
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      workout: activeWorkout,
      perSide:
        perSide ?? (type === "barbell" || type === "dumbbell" ? true : false),
      order: workoutList.length,
      createdAt: getNow(),
    };
    const next = [...exercises, newExercise];
    setExercises(next);
    await saveExercise(newExercise);
    setSearchTerm("");
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
    const payload = serializeBackup(exercises, sets, settings, sessions);
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
        if (payload.sessions?.length) {
          await saveSessions(payload.sessions);
        }
        setSettingsState({ ...settings, ...payload.settings, onboarded: true });
        await setSettings({ ...payload.settings, onboarded: true });
        setSets(await getAllSets());
        setSessions(await getAllSessions());
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
            perSide:
              row.type === "barbell" || row.type === "dumbbell" ? true : false,
            order: workoutList.length,
            createdAt: getNow(),
          };
          nextExercises = [...nextExercises, exercise];
          byName.set(name.toLowerCase(), exercise);
        }

        const ts = row.ts ?? getNow();
        const barLbSnapshot = row.barLbSnapshot || settings.barLb;
        const perSide =
          exercise.type === "barbell" || exercise.type === "dumbbell"
            ? exercise.perSide ?? true
            : false;
        const totals = row.totalLb
          ? { totalLb: row.totalLb, totalKg: row.totalKg }
          : computeTotals(
              row.inputLb,
              exercise.type,
              barLbSnapshot,
              settings.roundingKg,
              perSide,
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
      setSessions(await getAllSessions());
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

  const mirrorLastWriteLabel = mirrorState.lastWrite
    ? formatShortTime(mirrorState.lastWrite)
    : "Not yet";
  const mirrorFileName = mirrorState.fileName ?? "gym-log.json";

  const normalizedTerm = searchTerm.trim().toLowerCase();
  const suggestions = normalizedTerm
    ? EXERCISE_LIBRARY.filter((item) =>
        item.name.toLowerCase().includes(normalizedTerm),
      ).slice(0, 6)
    : [];
  const hasExactMatch = suggestions.some(
    (item) => item.name.toLowerCase() === normalizedTerm,
  );

  return (
    <AppShell title="Settings">
      <div className="space-y-5">
        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[color:var(--bg-card)] p-5 shadow-[var(--shadow)]">
          <div className="text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
            Workout builder
          </div>
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {workoutTabs.map((workout) => {
                const label = workout === "Custom" ? "+ Add" : workout;
                const active = workout === activeWorkout;
                return (
                  <button
                    key={workout}
                    type="button"
                    onClick={() => setActiveWorkout(workout)}
                    className={`min-h-[44px] rounded-full border px-4 text-xs uppercase tracking-[0.3em] transition ${
                      active
                        ? "border-[var(--accent)] bg-[color:var(--accent)] text-[color:var(--accent-ink)]"
                        : "border-[var(--border)] bg-transparent text-[color:var(--muted)]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-4">
              <div className="flex min-h-[48px] items-center gap-3">
                <IconSearch className="h-4 w-4 text-[color:var(--muted)]" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search or add exercise..."
                  className="w-full bg-transparent text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)]"
                />
              </div>
              {normalizedTerm ? (
                <div className="mt-3 space-y-2">
                  {suggestions.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() =>
                        handleAddExercise(item.name, item.type, item.perSide)
                      }
                      className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[color:var(--bg-card)] px-3 text-sm"
                    >
                      <span className="text-[color:var(--text)]">{item.name}</span>
                      <span className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
                        {item.type}
                      </span>
                    </button>
                  ))}
                  {!hasExactMatch ? (
                    <button
                      type="button"
                      onClick={() => handleAddExercise(searchTerm, "barbell", true)}
                      className="min-h-[44px] w-full rounded-xl border border-dashed border-[var(--border)] px-3 text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]"
                    >
                      Add &quot;{searchTerm}&quot;
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="mt-3 text-xs text-[color:var(--muted)]">
                  Type to add. Suggestions appear instantly.
                </div>
              )}
            </div>

            <div className="space-y-2">
              {groupedExercises(activeWorkout).map((exercise) => {
                const showPerSide =
                  exercise.type === "barbell" || exercise.type === "dumbbell";
                const perSideLabel =
                  exercise.type === "dumbbell" ? "Per dumbbell" : "Per side";
                return (
                  <div
                    key={exercise.id}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(activeWorkout, exercise.id)}
                    className="rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-3"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <div
                        draggable
                        onDragStart={() => handleDragStart(exercise.id)}
                        className="grid h-10 w-10 cursor-grab place-items-center rounded-full border border-[var(--border)] text-[color:var(--muted)]"
                        aria-label="Drag to reorder"
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
                        className="min-h-[44px] flex-1 bg-transparent text-sm text-[color:var(--text)] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(exercise)}
                        className="grid h-10 w-10 place-items-center rounded-full border border-[var(--border)] text-[color:var(--danger)]"
                        aria-label="Remove exercise"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <select
                        value={exercise.type}
                        onChange={(event) =>
                          handleExerciseUpdate(exercise.id, {
                            type: event.target.value as ExerciseType,
                          })
                        }
                        className="min-h-[44px] rounded-full border border-[var(--border)] bg-[color:var(--bg-card)] px-3 text-[10px] uppercase tracking-[0.3em] text-[color:var(--text)]"
                      >
                        {typeOptions.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      {showPerSide ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleExerciseUpdate(exercise.id, {
                              perSide: !(exercise.perSide ?? true),
                            })
                          }
                          className={`min-h-[44px] rounded-full border px-4 text-[10px] uppercase tracking-[0.3em] ${
                            exercise.perSide ?? true
                              ? "border-[var(--accent)] bg-[color:var(--accent)] text-[color:var(--accent-ink)]"
                              : "border-[var(--border)] bg-transparent text-[color:var(--muted)]"
                          }`}
                        >
                          {perSideLabel}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              {!groupedExercises(activeWorkout).length ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-center text-sm text-[color:var(--muted)]">
                  No exercises yet. Add one above.
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[color:var(--bg-card)] p-5 shadow-[var(--shadow)]">
          <div className="text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
            Storage
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] px-4 py-3 text-sm">
              <span className="text-[color:var(--text)]">Local autosave</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--success)]">
                ✓
              </span>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[color:var(--text)]">Mirror file</span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
                  {mirrorState.enabled ? "Enabled" : "Off"}
                </span>
              </div>
              <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
                Last write: {mirrorLastWriteLabel}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {!mirrorState.enabled ? (
                  <button
                    type="button"
                    onClick={handleEnableMirror}
                    disabled={mirrorBusy}
                    className="min-h-[44px] rounded-full border border-[var(--border)] px-4 text-xs uppercase tracking-[0.3em] text-[color:var(--text)] disabled:opacity-60"
                  >
                    Enable
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleWriteMirror}
                      disabled={mirrorBusy}
                      className="min-h-[44px] rounded-full border border-[var(--border)] px-4 text-xs uppercase tracking-[0.3em] text-[color:var(--text)] disabled:opacity-60"
                    >
                      Write now
                    </button>
                    <button
                      type="button"
                      onClick={handleDisableMirror}
                      disabled={mirrorBusy}
                      className="min-h-[44px] rounded-full border border-[var(--border)] px-4 text-xs uppercase tracking-[0.3em] text-[color:var(--danger)] disabled:opacity-60"
                    >
                      Disable
                    </button>
                  </>
                )}
              </div>
              <div className="mt-3 text-xs text-[color:var(--muted)]">
                Mirroring to: {mirrorFileName}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[color:var(--bg-card)] p-5 shadow-[var(--shadow)]">
          <div className="text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
            Quick setup
          </div>
          <div className="mt-4 grid gap-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
                Bar weight
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
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
                Units
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
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
                <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
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
                <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
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
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[color:var(--bg-card)] p-5 shadow-[var(--shadow)]">
          <div className="text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
            Presets
          </div>
          <div className="mt-3">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
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
                className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[color:var(--bg-elev)] px-3 py-2 text-sm text-[color:var(--text)]"
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
                onClick={() => updateSettings({ weightPresets: DEFAULT_WEIGHT_PRESETS })}
                className="min-h-[44px] rounded-xl border border-[var(--border)] px-3 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]"
              >
                Reset
              </button>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
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
                className="min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[color:var(--bg-elev)] px-3 py-2 text-sm text-[color:var(--text)]"
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
                className="min-h-[44px] rounded-xl border border-[var(--border)] px-3 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[color:var(--bg-card)] p-5 shadow-[var(--shadow)]">
          <div className="text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
            Backup
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExportJson}
              className="min-h-[44px] flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--text)]"
            >
              <IconDownload className="h-4 w-4" />
              Export backup
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="min-h-[44px] flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--text)]"
            >
              <IconDownload className="h-4 w-4" />
              Export CSV
            </button>
            <label className="min-h-[44px] flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--text)]">
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
          <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[color:var(--bg-card)] p-5 shadow-[var(--shadow)]">
            <div className="text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
              Install
            </div>
            <button
              type="button"
              onClick={async () => {
                await installPrompt.prompt();
                await installPrompt.userChoice;
                setInstallPrompt(null);
              }}
              className="mt-3 min-h-[44px] w-full rounded-xl bg-[color:var(--accent)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-ink)]"
            >
              Install app
            </button>
          </section>
        ) : null}
      </div>

      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
    </AppShell>
  );
};

export default SettingsPage;
