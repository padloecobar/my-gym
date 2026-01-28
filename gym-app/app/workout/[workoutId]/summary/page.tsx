"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { getWorkoutStats, makeWorkoutViewSelector } from "../../../../store/selectors/sessionSelectors";
import { useCatalogShallow } from "../../../../store/useCatalogStore";
import { useSessionStore } from "../../../../store/useSessionStore";
import { navigateWithTransition } from "../../../../lib/navigation";
import { formatKg, formatLb } from "../../../../lib/utils";

export default function WorkoutSummaryPage() {
  const params = useParams<{ workoutId: string }>();
  const router = useRouter();
  const workoutSelector = useMemo(() => makeWorkoutViewSelector(params.workoutId), [params.workoutId]);
  const workout = useSessionStore(workoutSelector);
  const { programs } = useCatalogShallow((state) => ({ programs: state.programs }));
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

  const { totalSets, totalVolume, exercisesCompleted } = getWorkoutStats(workout);
  const programName = program?.name ?? "Deleted program";

  return (
    <div className="page container">
      <header className="stack">
        <h1 className="card__title">Workout Complete</h1>
        <p className="muted">{programName}</p>
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
