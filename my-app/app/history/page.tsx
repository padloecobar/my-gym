"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AppShell from "@/components/AppShell";
import { IconChevronDown, IconSearch } from "@/components/Icons";
import SetBuilder from "@/components/SetBuilder";
import SwipeRow from "@/components/SwipeRow";
import Toast from "@/components/Toast";
import { useExercises } from "@/src/hooks/useExercises";
import { useSessions } from "@/src/hooks/useSessions";
import { useSets } from "@/src/hooks/useSets";
import { useSettings } from "@/src/hooks/useSettings";

import { computeTotals, formatKg, formatLb, toKg } from "../../lib/calc";
import {
  formatDateHeading,
  formatShortTime,
  getLocalDateKey,
} from "../../lib/date";

import type {
  Exercise,
  SessionEntry,
  SetEntry,
  SettingsState,
  WorkoutId,
} from "../../lib/types";

const SESSION_PAGE_SIZE = 14;

type SessionSummary = {
  date: string;
  setCount: number;
  exerciseCount: number;
  volumeLb: number;
  workoutId?: WorkoutId;
  exerciseOrder: string[];
  exerciseIds: string[];
};

const sortSessionsDesc = (sessions: SessionEntry[]) =>
  [...sessions].sort((a, b) => (a.date < b.date ? 1 : -1));

const sortSetsDesc = (sets: SetEntry[]) =>
  [...sets].sort((a, b) => b.ts - a.ts);

const buildSessionSummary = (
  date: string,
  sets: SetEntry[],
  session: SessionEntry | null,
  exercises: Exercise[],
  exerciseById: Map<string, Exercise>,
): SessionSummary | null => {
  if (!sets.length) return null;
  const exerciseIds = Array.from(new Set(sets.map((set) => set.exerciseId)));
  const workoutIds = new Set<WorkoutId>();
  exerciseIds.forEach((id) => {
    const workout = exerciseById.get(id)?.workout;
    if (workout) workoutIds.add(workout);
  });

  let inferredWorkout: WorkoutId | undefined;
  if (workoutIds.size === 1) {
    inferredWorkout = Array.from(workoutIds)[0];
  } else if (workoutIds.size > 1) {
    inferredWorkout = "Custom";
  }

  const resolvedWorkout = inferredWorkout ?? session?.workoutId;

  const snapshot = session?.exercisesSnapshot ?? [];
  let exerciseOrder = snapshot.filter((id) => exerciseIds.includes(id));

  if (!exerciseOrder.length && resolvedWorkout && workoutIds.size === 1) {
    exerciseOrder = exercises
      .filter(
        (exercise) =>
          exercise.workout === resolvedWorkout && exerciseIds.includes(exercise.id),
      )
      .sort((a, b) => a.order - b.order)
      .map((exercise) => exercise.id);
  }

  if (!exerciseOrder.length) {
    const firstByExercise = new Map<string, number>();
    [...sets]
      .sort((a, b) => a.ts - b.ts)
      .forEach((setEntry) => {
        if (!firstByExercise.has(setEntry.exerciseId)) {
          firstByExercise.set(setEntry.exerciseId, setEntry.ts);
        }
      });
    exerciseOrder = Array.from(firstByExercise.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([exerciseId]) => exerciseId);
  }

  const volumeLb = sets.reduce(
    (sum, setEntry) => sum + setEntry.totalLb * setEntry.reps,
    0,
  );

  return {
    date,
    setCount: sets.length,
    exerciseCount: exerciseIds.length,
    volumeLb,
    workoutId: resolvedWorkout,
    exerciseOrder,
    exerciseIds,
  };
};

const HistoryPage = () => {
  const router = useRouter();
  const {
    exercises,
    loading: exercisesLoading,
    error: exercisesError,
  } = useExercises();
  const {
    sessions,
    setSessions,
    listSessions,
    getSession,
    saveSession,
    deleteSessionWithSets,
  } = useSessions({ autoLoad: false });
  const {
    querySetsByDate,
    addSet,
    updateSet,
    deleteSet,
  } = useSets({ autoLoad: false });
  const {
    settings,
    loading: settingsLoading,
    error: settingsError,
    updateSettings,
  } = useSettings();
  const [sessionSets, setSessionSets] = useState<Record<string, SetEntry[]>>({});
  const [summaries, setSummaries] = useState<Record<string, SessionSummary>>({});
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [editingSet, setEditingSet] = useState<SetEntry | null>(null);
  const [toast, setToast] = useState<{ message: string; action?: () => void } | null>(
    null,
  );
  const toastTimer = useRef<number | null>(null);
  const initialLoadRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const exerciseById = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise])),
    [exercises],
  );

  const sessionByDate = useMemo(
    () => new Map(sessions.map((session) => [session.date, session])),
    [sessions],
  );

  const showLb = settings.unitDisplay === "both" || settings.unitDisplay === "lb";
  const showKg = settings.unitDisplay === "both" || settings.unitDisplay === "kg";

  const formatTotal = useCallback(
    (lb: number) => {
      const kg = toKg(lb, settings.roundingKg);
      return `${showLb ? `${formatLb(lb)} lb` : ""}${
        showLb && showKg ? " | " : ""
      }${showKg ? `${formatKg(kg, settings.roundingKg)} kg` : ""}`;
    },
    [settings.roundingKg, showKg, showLb],
  );

  const formatSetLabel = useCallback(
    (setEntry: SetEntry, exercise?: Exercise | null) => {
      if (!exercise) {
        return `${formatLb(setEntry.inputLb)}x${setEntry.reps}`;
      }
      if (exercise.type === "bodyweight") {
        return `BWx${setEntry.reps}`;
      }
      return `${formatLb(setEntry.inputLb)}x${setEntry.reps}`;
    },
    [],
  );

  const showToast = useCallback((message: string, action?: () => void) => {
    setToast({ message, action });
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const errors = [exercisesError, settingsError].filter(Boolean);
    if (!errors.length) return;
    console.error("History page data error:", errors);
  }, [exercisesError, settingsError]);

  const applySetListUpdate = useCallback(
    (date: string, nextList: SetEntry[]) => {
      setSessionSets((prev) => {
        const next = { ...prev };
        if (nextList.length) {
          next[date] = sortSetsDesc(nextList);
        } else {
          delete next[date];
        }
        return next;
      });
      setSummaries((prev) => {
        const next = { ...prev };
        const session = sessionByDate.get(date) ?? null;
        const summary = buildSessionSummary(
          date,
          nextList,
          session,
          exercises,
          exerciseById,
        );
        if (summary) {
          next[date] = summary;
        } else {
          delete next[date];
        }
        return next;
      });
      if (!nextList.length) {
        setSessions((prev) => prev.filter((session) => session.date !== date));
        setExpandedDates((prev) => {
          const next = { ...prev };
          delete next[date];
          return next;
        });
      }
    },
    [
      exerciseById,
      exercises,
      sessionByDate,
      setExpandedDates,
      setSessionSets,
      setSessions,
      setSummaries,
    ],
  );

  const loadSessions = useCallback(
    async ({
      before,
      append,
      exerciseList,
      exerciseMap,
    }: {
      before?: string;
      append?: boolean;
      exerciseList?: Exercise[];
      exerciseMap?: Map<string, Exercise>;
    } = {}) => {
      const list = exerciseList ?? exercises;
      const map = exerciseMap ?? exerciseById;
      const { sessions: page, hasMore: nextHasMore } = await listSessions({
        limit: SESSION_PAGE_SIZE,
        before,
      });
      const results = await Promise.all(
        page.map(async (session) => {
          const setsForDate = await querySetsByDate(session.date);
          const summary = buildSessionSummary(
            session.date,
            setsForDate,
            session,
            list,
            map,
          );
          if (!summary) return null;
          return { session, summary, sets: setsForDate };
        }),
      );
      const valid = results.filter(Boolean) as Array<{
        session: SessionEntry;
        summary: SessionSummary;
        sets: SetEntry[];
      }>;
      const nextSessions = valid.map((item) => item.session);
      const nextSummaries = valid.reduce<Record<string, SessionSummary>>(
        (acc, item) => {
          acc[item.session.date] = item.summary;
          return acc;
        },
        {},
      );
      const nextSets = valid.reduce<Record<string, SetEntry[]>>((acc, item) => {
        acc[item.session.date] = item.sets;
        return acc;
      }, {});

      setSessions((prev) =>
        append ? sortSessionsDesc([...prev, ...nextSessions]) : nextSessions,
      );
      setSummaries((prev) => (append ? { ...prev, ...nextSummaries } : nextSummaries));
      setSessionSets((prev) => (append ? { ...prev, ...nextSets } : nextSets));
      setHasMore(nextHasMore);
    },
    [
      exerciseById,
      exercises,
      listSessions,
      querySetsByDate,
      setHasMore,
      setSessionSets,
      setSessions,
      setSummaries,
    ],
  );

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    const lastDate = sessions[sessions.length - 1]?.date;
    if (!lastDate) return;
    setLoadingMore(true);
    try {
      await loadSessions({ before: lastDate, append: true });
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadSessions, loadingMore, sessions]);

  useEffect(() => {
    if (initialLoadRef.current) return;
    if (exercisesLoading || settingsLoading) return;
    initialLoadRef.current = true;
    const load = async () => {
      try {
        const exerciseMap = new Map(
          exercises.map((exercise) => [exercise.id, exercise]),
        );
        await loadSessions({ exerciseList: exercises, exerciseMap });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [exercises, exercisesLoading, loadSessions, settingsLoading]);

  const handleOpenSession = useCallback(
    async (date: string, workoutId?: WorkoutId) => {
      const updates: Partial<SettingsState> = { activeSessionDate: date };
      if (workoutId) {
        updates.lastWorkout = workoutId;
      }
      await updateSettings(updates);
      router.push("/");
    },
    [router, updateSettings],
  );

  const handleDuplicateAsToday = useCallback(
    async (session: SessionEntry, summary?: SessionSummary) => {
      const todayKey = getLocalDateKey();
      const existing = await getSession(todayKey);
      const workoutId = summary?.workoutId ?? session.workoutId;
      const exercisesSnapshot = summary?.exerciseOrder.length
        ? summary.exerciseOrder
        : session.exercisesSnapshot;
      const now = Date.now();
      const nextSession: SessionEntry = {
        date: todayKey,
        workoutId: workoutId ?? existing?.workoutId,
        createdAtTs: existing?.createdAtTs ?? now,
        updatedAtTs: now,
        notes: existing?.notes,
        exercisesSnapshot: exercisesSnapshot ?? existing?.exercisesSnapshot,
      };
      await saveSession(nextSession);
      const updates: Partial<SettingsState> = { activeSessionDate: todayKey };
      if (workoutId) {
        updates.lastWorkout = workoutId;
      }
      await updateSettings(updates);
      showToast("Duplicated for today.", () => {
        void handleOpenSession(todayKey, workoutId);
      });
    },
    [getSession, handleOpenSession, saveSession, showToast, updateSettings],
  );

  const handleDeleteSession = useCallback(
    async (date: string) => {
      const confirmed = window.confirm(
        "Delete this session and all sets for that date?",
      );
      if (!confirmed) return;
      await deleteSessionWithSets(date);
      setSessions((prev) => prev.filter((session) => session.date !== date));
      setSessionSets((prev) => {
        const next = { ...prev };
        delete next[date];
        return next;
      });
      setSummaries((prev) => {
        const next = { ...prev };
        delete next[date];
        return next;
      });
      setExpandedDates((prev) => {
        const next = { ...prev };
        delete next[date];
        return next;
      });
      showToast("Session deleted.");
    },
    [
      deleteSessionWithSets,
      setExpandedDates,
      setSessionSets,
      setSessions,
      setSummaries,
      showToast,
    ],
  );

  const handleDeleteSet = useCallback(
    async (setEntry: SetEntry) => {
      await deleteSet(setEntry.id);
      const currentList = sessionSets[setEntry.date] ?? [];
      const nextList = currentList.filter((item) => item.id !== setEntry.id);
      const wasLastSet = nextList.length === 0;
      applySetListUpdate(setEntry.date, nextList);
      const exercise = exerciseById.get(setEntry.exerciseId);
      showToast(`Deleted ${formatSetLabel(setEntry, exercise)}`, async () => {
        await addSet(setEntry);
        const restored = sortSetsDesc([...nextList, setEntry]);
        applySetListUpdate(setEntry.date, restored);
        if (wasLastSet) {
          const session = await getSession(setEntry.date);
          if (session) {
            setSessions((prev) => sortSessionsDesc([...prev, session]));
          }
        }
      });
    },
    [
      addSet,
      applySetListUpdate,
      deleteSet,
      exerciseById,
      formatSetLabel,
      getSession,
      sessionSets,
      setSessions,
      showToast,
    ],
  );

  const handleUpdate = useCallback(
    async (draft: {
      inputLb: number;
      reps: number;
      tags: string[];
      note: string;
      rpe?: number;
    }) => {
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
      const previous = editingSet;
      await updateSet(updated);
      const currentList = sessionSets[updated.date] ?? [];
      const nextList = currentList.map((item) =>
        item.id === updated.id ? updated : item,
      );
      applySetListUpdate(updated.date, nextList);
      setEditingSet(null);
      showToast(`Updated ${formatSetLabel(updated, exercise)}`, async () => {
        await updateSet(previous);
        const reverted = nextList.map((item) =>
          item.id === previous.id ? previous : item,
        );
        applySetListUpdate(previous.date, reverted);
      });
    },
    [
      applySetListUpdate,
      editingSet,
      exerciseById,
      formatSetLabel,
      sessionSets,
      settings.roundingKg,
      showToast,
      updateSet,
    ],
  );

  const filteredSessions = useMemo(() => {
    if (!search.trim()) return sessions;
    const term = search.toLowerCase();
    return sessions.filter((session) => {
      const summary = summaries[session.date];
      if (!summary) return true;
      return summary.exerciseIds.some((exerciseId) => {
        const name = exerciseById.get(exerciseId)?.name ?? "";
        return name.toLowerCase().includes(term);
      });
    });
  }, [exerciseById, search, sessions, summaries]);

  return (
    <>
      <AppShell title="History">
        <div className="space-y-5">
          <div className="flex min-h-[56px] items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[color:var(--bg-card)] px-4 py-3 shadow-[var(--shadow)]">
            <IconSearch className="h-5 w-5 text-[color:var(--muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find sessions"
              className="w-full bg-transparent text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)]"
            />
          </div>

          {loading ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] p-6 text-center text-sm text-[color:var(--muted)]">
              Loading history...
            </div>
          ) : null}

          {!loading && filteredSessions.length
            ? filteredSessions.map((session) => {
                const summary = summaries[session.date];
                if (!summary) return null;
                const expanded = Boolean(expandedDates[session.date]);
                const setsForDate = sessionSets[session.date] ?? [];
                const workoutLabel = summary.workoutId
                  ? summary.workoutId === "Custom"
                    ? "Custom Session"
                    : `Workout ${summary.workoutId}`
                  : "Session";
                const summaryLine = `${summary.setCount} sets · ${summary.exerciseCount} exercises · ${formatTotal(
                  summary.volumeLb,
                )}`;
                const setsByExercise = new Map<string, SetEntry[]>();
                setsForDate.forEach((setEntry) => {
                  const list = setsByExercise.get(setEntry.exerciseId) ?? [];
                  list.push(setEntry);
                  setsByExercise.set(setEntry.exerciseId, list);
                });

                return (
                  <div
                    key={session.date}
                    className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[color:var(--bg-card)] p-5 shadow-[var(--shadow)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenSession(session.date, summary.workoutId)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)] font-mono">
                          <span className="h-2 w-2 rounded-full bg-[color:var(--accent)]" />
                          <span>{formatDateHeading(session.date)}</span>
                        </div>
                        <div className="mt-2 text-sm font-semibold text-[color:var(--text)] font-serif">
                          {workoutLabel}
                        </div>
                        <div className="mt-2 text-xs text-[color:var(--muted)]">
                          {summaryLine}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedDates((prev) => ({
                            ...prev,
                            [session.date]: !prev[session.date],
                          }))
                        }
                        className="min-h-[44px] rounded-full border border-[var(--border)] bg-[color:var(--bg-elev)] px-3 text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]"
                        aria-expanded={expanded}
                        aria-controls={`session-${session.date}`}
                      >
                        <span className="flex items-center gap-2">
                          Details
                          <IconChevronDown
                            className={`h-3 w-3 transition ${expanded ? "rotate-180" : ""}`}
                          />
                        </span>
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenSession(session.date, summary.workoutId)}
                        className="min-h-[40px] rounded-full border border-[var(--border)] bg-[color:var(--accent)] px-4 text-[10px] uppercase tracking-[0.3em] text-[color:var(--accent-ink)]"
                      >
                        Open in Log
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateAsToday(session, summary)}
                        className="min-h-[40px] rounded-full border border-[var(--border)] bg-[color:var(--bg-elev)] px-4 text-[10px] uppercase tracking-[0.3em] text-[color:var(--text)]"
                      >
                        Duplicate as Today
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSession(session.date)}
                        className="min-h-[40px] rounded-full border border-[var(--border)] bg-[color:var(--bg-elev)] px-4 text-[10px] uppercase tracking-[0.3em] text-[color:var(--danger)]"
                      >
                        Delete Session
                      </button>
                    </div>

                    {expanded ? (
                      <div
                        id={`session-${session.date}`}
                        className="mt-5 space-y-4 animate-[fade-in_0.25s_ease-out]"
                      >
                        {summary.exerciseOrder.map((exerciseId) => {
                          const exercise = exerciseById.get(exerciseId);
                          const exerciseSets = setsByExercise.get(exerciseId) ?? [];
                          if (!exerciseSets.length) return null;
                          const isBodyweight = exercise?.type === "bodyweight";
                          const isBarbell = exercise?.type === "barbell";
                          const isDumbbell = exercise?.type === "dumbbell";
                          const perSide = isBarbell || isDumbbell ? exercise?.perSide ?? true : false;
                          return (
                            <div key={exerciseId} className="space-y-2">
                              <div className="text-sm font-semibold text-[color:var(--text)] font-serif">
                                {exercise?.name ?? "Unknown exercise"}
                              </div>
                              {exerciseSets.map((setEntry) => {
                                const barbellDetail = isBarbell
                                  ? perSide
                                    ? `Per side ${formatLb(setEntry.inputLb)} lb + bar ${setEntry.barLbSnapshot} lb`
                                    : `Total ${formatLb(setEntry.inputLb)} lb (bar ${setEntry.barLbSnapshot} lb)`
                                  : null;
                                const dumbbellDetail = isDumbbell
                                  ? perSide
                                    ? `Per dumbbell ${formatLb(setEntry.inputLb)} lb`
                                    : `Total load ${formatLb(setEntry.inputLb)} lb`
                                  : null;
                                return (
                                  <SwipeRow
                                    key={setEntry.id}
                                    onDelete={() => handleDeleteSet(setEntry)}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setEditingSet(setEntry)}
                                      className="flex min-h-[56px] w-full items-center justify-between rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] px-4 py-2 text-left"
                                    >
                                      <div>
                                        <div className="text-sm font-semibold text-[color:var(--text)] font-mono">
                                          {exercise?.type === "bodyweight"
                                            ? `BWx${setEntry.reps}`
                                            : `${formatLb(setEntry.inputLb)}x${setEntry.reps}`}
                                        </div>
                                        <div className="text-xs text-[color:var(--muted)]">
                                          {formatShortTime(setEntry.ts)}
                                        </div>
                                        {barbellDetail ? (
                                          <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-[color:var(--muted)]">
                                            {barbellDetail}
                                          </div>
                                        ) : null}
                                        {dumbbellDetail ? (
                                          <div className="mt-1 text-[10px] uppercase tracking-[0.25em] text-[color:var(--muted)]">
                                            {dumbbellDetail}
                                          </div>
                                        ) : null}
                                      </div>
                                      <div className="text-right text-xs text-[color:var(--muted)]">
                                        {!isBodyweight ? (
                                          <div className="font-mono">
                                            {formatTotal(setEntry.totalLb)}
                                          </div>
                                        ) : (
                                          <div>Bodyweight</div>
                                        )}
                                        {setEntry.tags?.length ? (
                                          <div className="mt-1 text-[color:var(--text)] font-mono">
                                            {setEntry.tags.join(" / ")}
                                          </div>
                                        ) : null}
                                      </div>
                                    </button>
                                  </SwipeRow>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })
            : null}

          {!loading && !filteredSessions.length ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] p-6 text-center text-sm text-[color:var(--muted)]">
              No sessions logged yet.
            </div>
          ) : null}

          {hasMore ? (
            <button
              type="button"
              onClick={() => void handleLoadMore()}
              disabled={loadingMore}
              className="min-h-[48px] w-full rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] text-[10px] uppercase tracking-[0.3em] text-[color:var(--text)] disabled:opacity-60"
            >
              {loadingMore ? "Loading..." : "Load older sessions"}
            </button>
          ) : null}
        </div>
      </AppShell>

      <SetBuilder
        open={Boolean(editingSet)}
        mode="edit"
        exercise={editingSet ? exerciseById.get(editingSet.exerciseId) ?? null : null}
        settings={
          editingSet ? { ...settings, barLb: editingSet.barLbSnapshot } : settings
        }
        initial={editingSet}
        onClose={() => setEditingSet(null)}
        onSave={handleUpdate}
        onDelete={() => {
          if (!editingSet) return;
          void handleDeleteSet(editingSet);
          setEditingSet(null);
        }}
      />

      {toast ? (
        <Toast
          message={toast.message}
          actionLabel={toast.action ? "Undo" : undefined}
          onAction={async () => {
            if (!toast?.action) return;
            try {
              await Promise.resolve(toast.action());
            } catch (err) {
              console.error("Undo action failed:", err);
              showToast("Undo failed");
            } finally {
              setToast(null);
            }
          }}
          onClose={() => setToast(null)}
        />
      ) : null}
    </>
  );
};

export default HistoryPage;
