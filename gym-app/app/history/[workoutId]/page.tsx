"use client";

import { useParams } from "next/navigation";
import HeaderBar from "../../components/HeaderBar";
import { useGymStore } from "../../../store/gym";
import { formatDate, formatKg, formatLb, formatTime } from "../../../lib/utils";

export default function WorkoutDetailPage() {
  const params = useParams<{ workoutId: string }>();
  const workout = useGymStore((state) => state.workouts.find((item) => item.id === params.workoutId));
  const program = useGymStore((state) =>
    workout ? state.programs.find((item) => item.id === workout.programId) : undefined
  );
  const exercises = useGymStore((state) => state.exercises);
  const vtHero = useGymStore((state) => state.ui.vtHero);

  if (!workout || !program) {
    return (
      <div className="page container">
        <p>Workout not found.</p>
      </div>
    );
  }

  const totalVolume = workout.entries
    .flatMap((entry) => entry.sets)
    .reduce((total, set) => (set.completed ? total + set.weightKg * set.reps : total), 0);

  return (
    <div className="page container">
      <HeaderBar title="Workout Detail" />

      <div className={`card ${vtHero?.type === "history" && vtHero.id === workout.id ? "vt-hero" : ""}`}>
        <div className="card__body">
          <h2 className="card__title">{program.name}</h2>
          <p className="card__meta">
            {formatDate(workout.endedAt ?? workout.startedAt)} - {formatTime(workout.endedAt ?? workout.startedAt)}
          </p>
          <div className="cluster">
            <span className="badge">{formatKg(totalVolume)} kg</span>
            <span className="badge">{formatLb(totalVolume)} lb</span>
          </div>
        </div>
      </div>

      <section className="stack">
        {workout.entries.map((entry) => {
          const exercise = exercises.find((item) => item.id === entry.exerciseId);
          if (!exercise) return null;
          return (
            <div key={entry.exerciseId} className="card">
              <div className="card__body">
                <div className="cluster cluster--between">
                  <h3 className="card__title">{exercise.name}</h3>
                  <span className="badge">{exercise.type}</span>
                </div>
                <div className="stack">
                  {entry.sets.map((set) => (
                    <div key={set.id} className={`set-row set-row--static ${set.completed ? "is-complete" : ""}`}>
                      <div>
                        <div className="set-row__kg">{formatKg(set.weightKg)} kg</div>
                        <div className="set-row__lb muted">{formatLb(set.weightKg)} lb</div>
                      </div>
                      <div className="set-row__reps">
                        <span className="set-row__reps-value">{set.reps}</span>
                        <span className="set-row__reps-label muted">reps</span>
                      </div>
                      <div className="set-row__meta">
                        <span className="set-row__status" aria-hidden="true">
                          {set.completed ? (
                            <svg viewBox="0 0 16 12" width="16" height="12" focusable="false" aria-hidden="true">
                              <path
                                d="M1 6l4 4 10-10"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : null}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
