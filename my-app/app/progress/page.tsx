"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/AppShell";
import { IconSearch } from "../../components/Icons";
import { estimateE1RM, formatKg, formatLb, toKg } from "../../lib/calc";
import { getAllExercises, getAllSettings, getAllSets } from "../../lib/db";
import { defaultSettings } from "../../lib/defaults";
import type { Exercise, SetEntry, SettingsState } from "../../lib/types";

const ProgressPage = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sets, setSets] = useState<SetEntry[]>([]);
  const [settings, setSettingsState] = useState<SettingsState>(defaultSettings);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      if (exerciseData.length) {
        setSelectedId(exerciseData[0].id);
      }
    };
    load();
  }, []);

  const selectedExercise = exercises.find((exercise) => exercise.id === selectedId) ?? null;

  const exerciseSets = useMemo(() => {
    if (!selectedExercise) return [] as SetEntry[];
    return sets.filter((set) => set.exerciseId === selectedExercise.id);
  }, [sets, selectedExercise]);

  const sessionStats = useMemo(() => {
    const byDate = new Map<string, { bestTotal: number; bestE1RM: number }>();
    exerciseSets.forEach((set) => {
      const existing = byDate.get(set.date);
      const bestTotal = Math.max(existing?.bestTotal ?? 0, set.totalLb);
      const e1rm = estimateE1RM(set.totalLb, set.reps, settings.e1rmFormula);
      const bestE1RM = Math.max(existing?.bestE1RM ?? 0, e1rm);
      byDate.set(set.date, { bestTotal, bestE1RM });
    });
    return Array.from(byDate.entries()).sort((a, b) => (a[0] > b[0] ? 1 : -1));
  }, [exerciseSets, settings.e1rmFormula]);

  const chartData = sessionStats.slice(-10).map(([, stats]) => stats.bestE1RM);
  const maxValue = Math.max(...chartData, 0);
  const minValue = Math.min(...chartData, maxValue);

  const showLb = settings.unitDisplay === "both" || settings.unitDisplay === "lb";
  const showKg = settings.unitDisplay === "both" || settings.unitDisplay === "kg";

  const bestTotal = exerciseSets.reduce((max, set) => Math.max(max, set.totalLb), 0);
  const bestE1RM = exerciseSets.reduce(
    (max, set) => Math.max(max, estimateE1RM(set.totalLb, set.reps, settings.e1rmFormula)),
    0,
  );

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

  return (
    <AppShell title="Progress">
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] px-4 py-3">
          <IconSearch className="h-4 w-4 text-[color:var(--muted)]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find exercise"
            className="w-full bg-transparent text-sm text-[color:var(--text)] outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {filteredExercises.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              onClick={() => setSelectedId(exercise.id)}
              className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.3em] ${
                selectedId === exercise.id
                  ? "bg-[color:var(--accent)] text-black"
                  : "border border-[var(--border)] text-[color:var(--muted)]"
              }`}
            >
              {exercise.name}
            </button>
          ))}
        </div>

        {selectedExercise ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-[var(--border)] bg-[color:var(--bg-card)] p-5">
              <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--muted)]">
                Bests
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-4">
                  <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                    Best Total
                  </div>
                  <div className="mt-2 text-lg font-semibold text-[color:var(--text)]">
                    {bestTotal ? formatTotal(bestTotal) : "-"}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[color:var(--bg-elev)] p-4">
                  <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                    Best e1RM
                  </div>
                  <div className="mt-2 text-lg font-semibold text-[color:var(--text)]">
                    {bestE1RM ? formatTotal(bestE1RM) : "-"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[color:var(--bg-card)] p-5">
              <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--muted)]">
                Last 10 Sessions / e1RM
              </div>
              <div className="mt-4">
                {chartData.length ? (
                  <svg viewBox="0 0 100 40" className="h-32 w-full">
                    <defs>
                      <linearGradient id="trend" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#7bdcff" />
                        <stop offset="100%" stopColor="#e6ff75" />
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
                      fill="#e6ff75"
                    />
                  </svg>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[color:var(--muted)]">
                    Log sets to see trend data.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[color:var(--muted)]">
            Add an exercise to start tracking progress.
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default ProgressPage;
