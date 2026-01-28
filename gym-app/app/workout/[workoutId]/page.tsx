"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import ExerciseCard from "../../components/ExerciseCard";
import type { Command } from "../../../commands/types";
import { makeCatalogMapsSelector } from "../../../store/selectors/catalogSelectors";
import { makeWorkoutViewSelector } from "../../../store/selectors/sessionSelectors";
import { useCatalogStore } from "../../../store/useCatalogStore";
import { useSessionStore, useSessionStoreApi } from "../../../store/useSessionStore";
import { useSettingsShallow } from "../../../store/useSettingsStore";
import { useUiShallow, useUiStoreApi } from "../../../store/useUiStore";

export default function WorkoutRunnerPage() {
  const params = useParams<{ workoutId: string }>();
  const workoutId = params.workoutId;
  const workoutSelector = useMemo(() => makeWorkoutViewSelector(workoutId), [workoutId]);
  const workout = useSessionStore(workoutSelector);
  const catalogSelector = useMemo(() => makeCatalogMapsSelector(), []);
  const { programById, exerciseById } = useCatalogStore(catalogSelector);
  const program = workout ? programById.get(workout.programId) : undefined;
  const { settings } = useSettingsShallow((state) => ({ settings: state.settings }));
  const sessionStore = useSessionStoreApi();
  const { vtHero } = useUiShallow((state) => ({ vtHero: state.vtHero }));
  const uiStore = useUiStoreApi();
  const { toggleSetComplete, deleteSet, addSet } = sessionStore.getState();
  const { openEditSet, openConfirm, showSnackbar } = uiStore.getState();

  if (!workout || !program) {
    return (
      <div className="page container">
        <p>Workout not found.</p>
      </div>
    );
  }

  const handleFinish = () => {
    const command: Command = { type: "FINISH_WORKOUT", payload: { workoutId, navigateTo: `/workout/${workoutId}/summary` } };
    openConfirm({
      title: "End workout?",
      message: "Finish now to lock this workout into history.",
      confirmLabel: "Finish",
      command,
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
          const exercise = exerciseById.get(entry.exerciseId);
          if (!exercise) return null;
          return (
            <ExerciseCard
              key={entry.exerciseId}
              exercise={exercise}
              entry={entry}
              barWeight={settings.defaultBarWeight}
              onToggleSet={(setId) => toggleSetComplete(workoutId, entry.exerciseId, setId)}
              onEditSet={(setId) => openEditSet({ workoutId, exerciseId: entry.exerciseId, setId })}
              onDeleteSet={(setId) => {
                const payload = deleteSet(workoutId, entry.exerciseId, setId);
                if (payload) {
                  showSnackbar("Set deleted", "Undo", { type: "UNDO_DELETE_SET", payload });
                }
              }}
              onAddSet={() => addSet(workoutId, entry.exerciseId)}
            />
          );
        })}
      </section>
    </div>
  );
}
