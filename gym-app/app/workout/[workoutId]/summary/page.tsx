"use client";

import { useParams, useRouter } from "next/navigation";
import { useGymStore } from "../../../../store/gym";
import { navigateWithTransition } from "../../../../lib/navigation";
import { formatKg, formatLb } from "../../../../lib/utils";

export default function WorkoutSummaryPage() {
  const params = useParams<{ workoutId: string }>();
  const router = useRouter();
  const workout = useGymStore((state) => state.workouts.find((item) => item.id === params.workoutId));
  const program = useGymStore((state) =>
    workout ? state.programs.find((item) => item.id === workout.programId) : undefined
  );

  if (!workout || !program) {
    return (
      <div className="page container">
        <p>Workout not found.</p>
      </div>
    );
  }

  const completedSets = workout.entries.flatMap((entry) => entry.sets.filter((set) => set.completed));
  const totalSets = completedSets.length;
  const totalVolume = completedSets.reduce((total, set) => total + set.weightKg * set.reps, 0);
  const exercisesCompleted = workout.entries.filter((entry) => entry.sets.some((set) => set.completed)).length;

  return (
    <div className="page container">
      <header className="stack">
        <h1 className="card__title">Workout Complete</h1>
        <p className="muted">{program.name}</p>
      </header>

      <section className="summary-stats">
        <div className="summary-stat">
          <div className="summary-stat__value">{exercisesCompleted}</div>
          <div className="muted">Exercises completed</div>
        </div>
        <div className="summary-stat">
          <div className="summary-stat__value">{totalSets}</div>
          <div className="muted">Total sets</div>
        </div>
        <div className="summary-stat">
          <div className="summary-stat__value">{formatKg(totalVolume)} kg</div>
          <div className="muted">{formatLb(totalVolume)} lb total volume</div>
        </div>
      </section>

      <button
        type="button"
        className="btn btn--primary"
        onClick={() => navigateWithTransition(router, "/")}
      >
        Done
      </button>
    </div>
  );
}
