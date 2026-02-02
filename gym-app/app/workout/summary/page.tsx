"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { getWorkoutStats, makeWorkoutViewSelector } from "../../../store/selectors/sessionSelectors";
import { useCatalogShallow } from "../../../store/useCatalogStore";
import { useSessionStore } from "../../../store/useSessionStore";
import { navigateWithTransition } from "../../shared/lib/navigation";
import { formatWeight } from "../../shared/lib/utils";

export default function WorkoutSummaryPage() {
  const searchParams = useSearchParams();
  const workoutId = searchParams.get("workoutId") ?? undefined;
  const router = useRouter();

  const workoutSelector = useMemo(
    () => (workoutId ? makeWorkoutViewSelector(workoutId) : () => null),
    [workoutId]
  );
  const workout = useSessionStore(workoutSelector);
  const { programs } = useCatalogShallow((state) => ({ programs: state.programs }));
  const program = useMemo(
    () => (workout ? programs.find((item) => item.id === workout.programId) : undefined),
    [programs, workout]
  );

  if (!workoutId) {
    return (
      <div className="page container">
        <p>Select a workout summary to view.</p>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="page container">
        <p>Workout not found.</p>
      </div>
    );
  }

  const { totalSets, totalVolume, exerciseCount } = getWorkoutStats(workout);
  const programName = program?.name ?? "Deleted program";

  return (
    <div className="page container summary-page">
      <header className="stack summary-page__header">
        <div className="summary-page__badge" aria-hidden>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12l3 3 5-6" />
          </svg>
        </div>
        <h1 className="card__title">Workout Complete</h1>
        <p className="muted">{programName}</p>
      </header>

      <section className="summary-stats">
        <div className="summary-stat">
          <div className="summary-stat__value">{exerciseCount}</div>
          <div className="muted">Exercises</div>
        </div>
        <div className="summary-stat">
          <div className="summary-stat__value">{totalSets}</div>
          <div className="muted">Total sets</div>
        </div>
        <div className="summary-stat">
          <div className="summary-stat__value">{formatWeight(totalVolume)}</div>
          <div className="muted">Total volume</div>
        </div>
      </section>

      <div className="summary-page__sticky">
        <button
          type="button"
          className="btn btn--primary summary-page__done"
          onClick={() => navigateWithTransition(router, "/")}
        >
          Done
        </button>
      </div>
    </div>
  );
}
