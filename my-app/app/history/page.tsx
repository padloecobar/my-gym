"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "../../components/AppShell";
import SetBuilder from "../../components/SetBuilder";
import SwipeRow from "../../components/SwipeRow";
import Toast from "../../components/Toast";
import { IconSearch } from "../../components/Icons";
import {
  addSet,
  deleteSet,
  getAllExercises,
  getAllSettings,
  getAllSets,
  updateSet,
} from "../../lib/db";
import { computeTotals, formatKg, formatLb, toKg } from "../../lib/calc";
import { formatDateHeading, formatShortTime } from "../../lib/date";
import { defaultSettings } from "../../lib/defaults";
import type { Exercise, SetEntry, SettingsState } from "../../lib/types";

const HistoryPage = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sets, setSets] = useState<SetEntry[]>([]);
  const [settings, setSettingsState] = useState<SettingsState>(defaultSettings);
  const [search, setSearch] = useState("");
  const [editingSet, setEditingSet] = useState<SetEntry | null>(null);
  const [toast, setToast] = useState<{ message: string; action?: () => void } | null>(
    null,
  );
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const [exerciseData, settingsData, setData] = await Promise.all([
        getAllExercises(),
        getAllSettings(),
        getAllSets(),
      ]);
      setExercises(exerciseData);
      setSettingsState({ ...defaultSettings, ...settingsData } as SettingsState);
      setSets(setData);
    };
    load();
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const exerciseById = useMemo(() => {
    return new Map(exercises.map((exercise) => [exercise.id, exercise]));
  }, [exercises]);

  const filteredSets = useMemo(() => {
    if (!search.trim()) return sets;
    const term = search.toLowerCase();
    return sets.filter((set) => {
      const exercise = exerciseById.get(set.exerciseId);
      return exercise?.name.toLowerCase().includes(term);
    });
  }, [search, sets, exerciseById]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, SetEntry[]>();
    filteredSets.forEach((set) => {
      const list = map.get(set.date) ?? [];
      list.push(set);
      map.set(set.date, list);
    });
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filteredSets]);

  const showLb = settings.unitDisplay === "both" || settings.unitDisplay === "lb";
  const showKg = settings.unitDisplay === "both" || settings.unitDisplay === "kg";

  const showToast = (message: string, action?: () => void) => {
    setToast({ message, action });
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (setEntry: SetEntry) => {
    await deleteSet(setEntry.id);
    setSets((prev) => prev.filter((item) => item.id !== setEntry.id));
    showToast("Deleted - Undo", async () => {
      await addSet(setEntry);
      setSets((prev) => [setEntry, ...prev]);
    });
  };

  const handleUpdate = async (draft: {
    inputLb: number;
    reps: number;
    tags: string[];
    note: string;
    rpe?: number;
  }) => {
    if (!editingSet) return;
    const exercise = exerciseById.get(editingSet.exerciseId);
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
  };

  return (
    <>
      <AppShell title="History">
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] px-4 py-3">
            <IconSearch className="h-4 w-4 text-[color:var(--muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search exercise"
              className="w-full bg-transparent text-sm text-[color:var(--text)] outline-none"
            />
          </div>

          {groupedByDate.map(([date, dateSets]) => {
            const byExercise = new Map<string, SetEntry[]>();
            dateSets.forEach((set) => {
              const list = byExercise.get(set.exerciseId) ?? [];
              list.push(set);
              byExercise.set(set.exerciseId, list);
            });
            return (
              <div
                key={date}
                className="rounded-3xl border border-[var(--border)] bg-[color:var(--bg-card)] p-5"
              >
                <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--muted)]">
                  {formatDateHeading(date)}
                </div>
                <div className="mt-4 space-y-4">
                  {Array.from(byExercise.entries()).map(([exerciseId, exerciseSets]) => {
                    const exercise = exerciseById.get(exerciseId);
                    const name = exercise?.name ?? "Unknown exercise";
                    return (
                      <div key={exerciseId} className="space-y-2">
                        <div className="text-sm font-semibold text-[color:var(--text)]">
                          {name}
                        </div>
                        {exerciseSets.map((set) => (
                          <SwipeRow key={set.id} onDelete={() => handleDelete(set)}>
                            <button
                              type="button"
                              onClick={() => setEditingSet(set)}
                              className="flex w-full items-center justify-between rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] px-4 py-3 text-left"
                            >
                              <div>
                                <div className="text-sm font-semibold text-[color:var(--text)]">
                                  {formatLb(set.inputLb)}x{set.reps}
                                </div>
                                <div className="text-xs text-[color:var(--muted)]">
                                  {formatShortTime(set.ts)}
                                </div>
                              </div>
                              <div className="text-right text-xs text-[color:var(--muted)]">
                                <div>
                                  {showLb ? `${formatLb(set.totalLb)} lb` : null}
                                  {showLb && showKg ? (
                                    <span className="mx-1">|</span>
                                  ) : null}
                                  {showKg
                                    ? `${formatKg(
                                        toKg(set.totalLb, settings.roundingKg),
                                        settings.roundingKg,
                                      )} kg`
                                    : null}
                                </div>
                                {set.tags?.length ? (
                                  <div className="mt-1 text-[color:var(--text)]">
                                    {set.tags.join(" / ")}
                                  </div>
                                ) : null}
                              </div>
                            </button>
                          </SwipeRow>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {!groupedByDate.length ? (
            <div className="rounded-3xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[color:var(--muted)]">
              No sets logged yet.
            </div>
          ) : null}
        </div>
      </AppShell>

      <SetBuilder
        open={Boolean(editingSet)}
        mode="edit"
        exercise={editingSet ? exerciseById.get(editingSet.exerciseId) ?? null : null}
        settings={
          editingSet
            ? { ...settings, barLb: editingSet.barLbSnapshot }
            : settings
        }
        initial={editingSet}
        onClose={() => setEditingSet(null)}
        onSave={handleUpdate}
        onDelete={() => {
          if (!editingSet) return;
          handleDelete(editingSet);
          setEditingSet(null);
        }}
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

export default HistoryPage;
