"use client";

import HeaderBar from "../components/HeaderBar";
import VtLink from "../components/VtLink";
import { useGymStore } from "../../store/gym";
import { byDateDesc, formatDate, formatKg } from "../../lib/utils";

export default function HistoryPage() {
  const workouts = useGymStore((state) => state.workouts);
  const programs = useGymStore((state) => state.programs);
  const setVtHero = useGymStore((state) => state.setVtHero);
  const vtHero = useGymStore((state) => state.ui.vtHero);

  const completed = workouts.filter((workout) => workout.endedAt).sort(byDateDesc);
  const grouped = completed.reduce<Record<string, typeof completed>>((acc, workout) => {
    const dateKey = new Date(workout.endedAt ?? workout.startedAt).toDateString();
    acc[dateKey] = acc[dateKey] ? [...acc[dateKey], workout] : [workout];
    return acc;
  }, {});

  const programById = new Map(programs.map((program) => [program.id, program]));

  const calcVolume = (workoutId: string) => {
    const workout = completed.find((item) => item.id === workoutId);
    if (!workout) return 0;
    return workout.entries.flatMap((entry) => entry.sets).reduce((total, set) => {
      if (!set.completed) return total;
      return total + set.weightKg * set.reps;
    }, 0);
  };

  return (
    <div className="page container">
      <HeaderBar title="History" />

      <div className="stack virtual-list">
        {Object.entries(grouped).map(([dateKey, items]) => (
          <section key={dateKey} className="page__section">
            <h2 className="card__title">{formatDate(new Date(dateKey).getTime())}</h2>
            <div className="stack">
              {items.map((workout) => {
                const program = programById.get(workout.programId);
                const volume = calcVolume(workout.id);
                return (
                  <VtLink
                    key={workout.id}
                    href={`/history/${workout.id}`}
                    className={`card program-card ${
                      vtHero?.type === "history" && vtHero.id === workout.id ? "vt-hero" : ""
                    }`}
                    onClick={() => setVtHero({ type: "history", id: workout.id })}
                  >
                    <div className="card__body">
                      <div className="program-card__header">
                        <h3 className="card__title">{program?.name ?? "Workout"}</h3>
                        <span className="badge">{formatKg(volume)} kg</span>
                      </div>
                      <p className="card__meta">{formatDate(workout.endedAt ?? workout.startedAt)}</p>
                    </div>
                  </VtLink>
                );
              })}
            </div>
          </section>
        ))}
        {completed.length === 0 ? <p className="muted">No workouts yet.</p> : null}
      </div>
    </div>
  );
}
