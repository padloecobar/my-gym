"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/AppShell";
import Chip from "../../components/Chip";
import { IconSearch } from "../../components/Icons";
import { estimateE1RM, formatKg, formatLb, toKg } from "../../lib/calc";
import { formatDateHeading } from "../../lib/date";
import { useExercises } from "../../src/hooks/useExercises";
import { useSets } from "../../src/hooks/useSets";
import { useSettings } from "../../src/hooks/useSettings";
import type { SetEntry } from "../../lib/types";

const ProgressPage = () => {
  const {
    exercises,
    error: exercisesError,
  } = useExercises();
  const { sets, error: setsError } = useSets();
  const { settings, error: settingsError } = useSettings();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [range, setRange] = useState<5 | 10 | 20 | "all">(10);

  useEffect(() => {
    const errors = [exercisesError, setsError, settingsError].filter(Boolean);
    if (!errors.length) return;
    console.error("Progress page data error:", errors);
  }, [exercisesError, setsError, settingsError]);

  const resolvedSelectedId = selectedId ?? exercises[0]?.id ?? null;
  const selectedExercise =
    exercises.find((exercise) => exercise.id === resolvedSelectedId) ?? null;
  const isBodyweight = selectedExercise?.type === "bodyweight";

  const exerciseSets = useMemo(() => {
    if (!selectedExercise) return [] as SetEntry[];
    return sets.filter((set) => set.exerciseId === selectedExercise.id);
  }, [sets, selectedExercise]);

  const sessionStats = useMemo(() => {
    const byDate = new Map<
      string,
      { bestTotal: number; bestE1RM: number; bestReps: number }
    >();
    exerciseSets.forEach((set) => {
      const existing = byDate.get(set.date) ?? {
        bestTotal: 0,
        bestE1RM: 0,
        bestReps: 0,
      };
      const bestTotal = Math.max(existing.bestTotal, set.totalLb);
      const e1rm = estimateE1RM(set.totalLb, set.reps, settings.e1rmFormula);
      const bestE1RM = Math.max(existing.bestE1RM, e1rm);
      const bestReps = Math.max(existing.bestReps, set.reps);
      byDate.set(set.date, { bestTotal, bestE1RM, bestReps });
    });
    return Array.from(byDate.entries()).sort((a, b) => (a[0] > b[0] ? 1 : -1));
  }, [exerciseSets, settings.e1rmFormula]);

  const rangedStats =
    range === "all" ? sessionStats : sessionStats.slice(-range);
  const chartData = rangedStats.map(([, stats]) =>
    isBodyweight ? stats.bestReps : stats.bestE1RM,
  );
  const maxValue = Math.max(...chartData, 0);
  const minValue = Math.min(...chartData, maxValue);

  const showLb = settings.unitDisplay === "both" || settings.unitDisplay === "lb";
  const showKg = settings.unitDisplay === "both" || settings.unitDisplay === "kg";

  const bestTotal = exerciseSets.reduce((max, set) => Math.max(max, set.totalLb), 0);
  const bestE1RM = exerciseSets.reduce(
    (max, set) => Math.max(max, estimateE1RM(set.totalLb, set.reps, settings.e1rmFormula)),
    0,
  );
  const bestReps = exerciseSets.reduce((max, set) => Math.max(max, set.reps), 0);

  const formatTotal = (lb: number) => {
    const kg = toKg(lb, settings.roundingKg);
    return `${showLb ? `${formatLb(lb)} lb` : ""}${
      showLb && showKg ? " | " : ""
    }${showKg ? `${formatKg(kg, settings.roundingKg)} kg` : ""}`;
  };

  const points = chartData
    .map((value, index) => {
      const x = chartData.length <= 1 ? 50 : (index / (chartData.length - 1)) * 100;
      const range = maxValue - minValue || 1;
      const y = 36 - ((value - minValue) / range) * 28;
      return `${x},${y}`;
    })
    .join(" ");

  const filteredExercises = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(search.toLowerCase()),
  );

  const setCountByExercise = useMemo(() => {
    const map = new Map<string, number>();
    sets.forEach((set) => {
      map.set(set.exerciseId, (map.get(set.exerciseId) ?? 0) + 1);
    });
    return map;
  }, [sets]);

  return (
    <AppShell title="Progress">
      <div className="space-y-5">
        <div className="flex min-h-[56px] items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[color:var(--bg-card)] px-4 py-3 shadow-[var(--shadow)]">
          <IconSearch className="h-5 w-5 text-[color:var(--muted)]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find exercise"
            className="w-full bg-transparent text-sm text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)]"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {filteredExercises.map((exercise) => {
            const count = setCountByExercise.get(exercise.id) ?? 0;
            const active = resolvedSelectedId === exercise.id;
            return (
              <button
                key={exercise.id}
                type="button"
                onClick={() => setSelectedId(exercise.id)}
                className={`min-h-[56px] min-w-[160px] rounded-2xl border border-[var(--border)] px-3 py-2 text-left transition ${
                  active
                    ? "bg-[color:var(--accent)] text-[color:var(--accent-ink)] shadow-[var(--shadow)]"
                    : "bg-[color:var(--bg-card)] text-[color:var(--text)]"
                }`}
              >
                <div className="text-[10px] uppercase tracking-[0.35em] opacity-80">
                  Exercise
                </div>
                <div className="mt-1 text-sm font-semibold">{exercise.name}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.3em] opacity-70">
                  {count} sets
                </div>
              </button>
            );
          })}
        </div>

        {selectedExercise ? (
          <div className="space-y-4">
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[color:var(--bg-card)] p-5 shadow-[var(--shadow)]">
              <div className="text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
                Bests + summary
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {isBodyweight ? (
                  <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-4">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
                      Best reps
                    </div>
                    <div className="mt-2 text-lg font-semibold text-[color:var(--text)] font-mono">
                      {bestReps || "-"}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-4">
                      <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
                        Best Total
                      </div>
                      <div className="mt-2 text-base font-semibold text-[color:var(--text)] font-mono">
                        {bestTotal ? formatTotal(bestTotal) : "-"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-4">
                      <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
                        Best e1RM
                      </div>
                      <div className="mt-2 text-base font-semibold text-[color:var(--text)] font-mono">
                        {bestE1RM ? formatTotal(bestE1RM) : "-"}
                      </div>
                    </div>
                  </>
                )}
                <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-4">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
                    Sessions
                  </div>
                  <div className="mt-2 text-lg font-semibold text-[color:var(--text)] font-mono">
                    {sessionStats.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[color:var(--bg-card)] p-5 shadow-[var(--shadow)]">
              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
                <span>{isBodyweight ? "Reps trend" : "e1RM trend"}</span>
                <div className="flex flex-wrap gap-2">
                  {([5, 10, 20, "all"] as const).map((value) => (
                    <Chip
                      key={value}
                      size="sm"
                      selected={range === value}
                      onClick={() => setRange(value)}
                    >
                      {value === "all" ? "ALL" : value}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                {chartData.length ? (
                  <svg viewBox="0 0 100 40" className="h-32 w-full">
                    <defs>
                      <linearGradient id="trend" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="var(--accent-2)" />
                        <stop offset="100%" stopColor="var(--accent)" />
                      </linearGradient>
                    </defs>
                    <polyline
                      fill="none"
                      stroke="url(#trend)"
                      strokeWidth="2"
                      points={points}
                    />
                    <circle
                      cx={points.split(" ").slice(-1)[0]?.split(",")[0] ?? 0}
                      cy={points.split(" ").slice(-1)[0]?.split(",")[1] ?? 0}
                      r="2"
                      fill="var(--accent)"
                    />
                  </svg>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[color:var(--muted)]">
                    Log sets to see trend data.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[color:var(--bg-card)] p-5 shadow-[var(--shadow)]">
              <div className="text-[11px] uppercase tracking-[0.35em] text-[color:var(--muted)]">
                Recent sessions
              </div>
              <div className="mt-4 space-y-2">
                {rangedStats.length ? (
                  [...rangedStats].reverse().map(([date, stats]) => (
                    <div
                      key={date}
                      className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] px-4 py-3 text-sm"
                    >
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--text)]">
                          {formatDateHeading(date)}
                        </div>
                        <div className="text-xs text-[color:var(--muted)]">
                          {isBodyweight
                            ? `Best reps ${stats.bestReps}`
                            : `Best total ${formatTotal(stats.bestTotal)}`}
                        </div>
                      </div>
                      <div className="text-right text-xs text-[color:var(--muted)] font-mono">
                        {isBodyweight
                          ? `${stats.bestReps} reps`
                          : `e1RM ${formatTotal(stats.bestE1RM)}`}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[color:var(--muted)]">
                    No sessions yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] p-6 text-center text-sm text-[color:var(--muted)]">
            Add an exercise to start tracking progress.
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default ProgressPage;
