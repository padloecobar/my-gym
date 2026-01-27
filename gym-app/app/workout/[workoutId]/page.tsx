"use client";

import { useParams, useRouter } from "next/navigation";
import ExerciseCard from "../../components/ExerciseCard";
import { useGymStore } from "../../../store/gym";
import { navigateWithTransition } from "../../../lib/navigation";

export default function WorkoutRunnerPage() {
  const params = useParams<{ workoutId: string }>();
  const router = useRouter();
  const workoutId = params.workoutId;
  const workout = useGymStore((state) => state.workouts.find((item) => item.id === workoutId));
  const program = useGymStore((state) =>
    workout ? state.programs.find((item) => item.id === workout.programId) : undefined
  );
  const exercises = useGymStore((state) => state.exercises);
  const settings = useGymStore((state) => state.settings);
  const toggleSetComplete = useGymStore((state) => state.toggleSetComplete);
  const openEditSet = useGymStore((state) => state.openEditSet);
  const deleteSet = useGymStore((state) => state.deleteSet);
  const addSet = useGymStore((state) => state.addSet);
  const openConfirm = useGymStore((state) => state.openConfirm);
  const finishWorkout = useGymStore((state) => state.finishWorkout);
  const vtHero = useGymStore((state) => state.ui.vtHero);

  if (!workout || !program) {
    return (
      <div className="page container">
        <p>Workout not found.</p>
      </div>
    );
  }

  const handleFinish = () => {
    openConfirm({
      title: "End workout?",
      message: "Finish now to lock this workout into history.",
      confirmLabel: "Finish",
      onConfirm: () => {
        finishWorkout(workoutId);
        navigateWithTransition(router, `/workout/${workoutId}/summary`);
      },
    });
  };

  return (
    <div className="page container">
      <div className={`runner-header ${vtHero?.type === "program" && vtHero.id === program.id ? "vt-hero" : ""}`}>
        <div className="runner-header__row">
          <div>
            <div className="muted">Workout Runner</div>
            <div className="runner-header__title">{program.name}</div>
          </div>
          <button type="button" className="btn btn--primary" onClick={handleFinish}>
            Finish
          </button>
        </div>
      </div>

      <section className="page__section virtual-list">
        {workout.entries.map((entry) => {
          const exercise = exercises.find((item) => item.id === entry.exerciseId);
          if (!exercise) return null;
          return (
            <ExerciseCard
              key={entry.exerciseId}
              exercise={exercise}
              entry={entry}
              barWeight={settings.defaultBarWeight}
              onToggleSet={(setId) => toggleSetComplete(workoutId, entry.exerciseId, setId)}
              onEditSet={(setId) => openEditSet({ workoutId, exerciseId: entry.exerciseId, setId })}
              onDeleteSet={(setId) => deleteSet(workoutId, entry.exerciseId, setId)}
              onAddSet={() => addSet(workoutId, entry.exerciseId)}
            />
          );
        })}
      </section>
    </div>
  );
}
