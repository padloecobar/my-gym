"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import HeaderBar from "../../components/HeaderBar";
import BackButton from "../../components/BackButton";
import { getWorkoutStats, makeWorkoutViewSelector } from "../../../store/selectors/sessionSelectors";
import { useCatalogShallow } from "../../../store/useCatalogStore";
import { useSessionStore } from "../../../store/useSessionStore";
import { useUiShallow } from "../../../store/useUiStore";
import { formatDate, formatKg, formatLb, formatTime } from "../../../lib/utils";

export default function WorkoutDetailPage() {
  const params = useParams<{ workoutId: string }>();
  const workoutSelector = useMemo(() => makeWorkoutViewSelector(params.workoutId), [params.workoutId]);
  const workout = useSessionStore(workoutSelector);
  const { programs, exercises } = useCatalogShallow((state) => ({
    programs: state.programs,
    exercises: state.exercises,
  }));
  const { vtHero } = useUiShallow((state) => ({ vtHero: state.vtHero }));
  const program = useMemo(
    () => (workout ? programs.find((item) => item.id === workout.programId) : undefined),
    [programs, workout]
  );

  if (!workout) {
    return (
      <div className="page container">
        <p>Workout not found.</p>
      </div>
    );
  }

  const { totalVolume } = getWorkoutStats(workout);
  const programName = program?.name ?? "Deleted program";

  return (
    <div className="page container">
      <HeaderBar title="Workout Detail" />
      <BackButton />

      <div className={`card ${vtHero?.type === "history" && vtHero.id === workout.id ? "vt-hero" : ""}`}>
        <div className="card__body">
          <h2 className="card__title">{programName}</h2>
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
                    <div key={set.id} className="set-row set-row--static">
                      <div>
                        <div className="set-row__kg">{formatKg(set.weightKg)} kg</div>
                        <div className="set-row__lb muted">{formatLb(set.weightKg)} lb</div>
                      </div>
                      <div className="set-row__reps">
                        <span className="set-row__reps-value">{set.reps}</span>
                        <span className="set-row__reps-label muted">reps</span>
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
