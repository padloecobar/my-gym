"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ExerciseCard from "../features/workout/components/ExerciseCard";
import BackButton from "../shared/components/BackButton";
import type { Command } from "../../commands/types";
import { makeCatalogMapsSelector } from "../../store/selectors/catalogSelectors";
import { makeWorkoutViewSelector } from "../../store/selectors/sessionSelectors";
import { useCatalogStore } from "../../store/useCatalogStore";
import { useSessionStore, useSessionStoreApi } from "../../store/useSessionStore";
import { useSettingsShallow } from "../../store/useSettingsStore";
import { useUiShallow, useUiStoreApi } from "../../store/useUiStore";

export default function WorkoutRunnerPage() {
  const searchParams = useSearchParams();
  const workoutId = searchParams.get("workoutId") ?? undefined;

  const workoutSelector = useMemo(
    () => (workoutId ? makeWorkoutViewSelector(workoutId) : () => null),
    [workoutId]
  );
  const workout = useSessionStore(workoutSelector);
  const catalogSelector = useMemo(() => makeCatalogMapsSelector(), []);
  const { programById, exerciseById } = useCatalogStore(catalogSelector);
  const program = workout ? programById.get(workout.programId) : undefined;
  const { settings } = useSettingsShallow((state) => ({ settings: state.settings }));
  const sessionStore = useSessionStoreApi();
  const { vtHero } = useUiShallow((state) => ({ vtHero: state.vtHero }));
  const uiStore = useUiStoreApi();
  const { deleteSet, addSet } = sessionStore.getState();
  const { openEditSet, openConfirm, showSnackbar } = uiStore.getState();
  const [lastAddedSetId, setLastAddedSetId] = useState<string | null>(null);

  useEffect(() => {
    if (lastAddedSetId == null) return;
    const t = setTimeout(() => setLastAddedSetId(null), 1800);
    return () => clearTimeout(t);
  }, [lastAddedSetId]);

  if (!workoutId) {
    return (
      <div className="page container">
        <p>Select a workout to begin.</p>
        <BackButton />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="page container">
        <p>Workout not found.</p>
        <BackButton />
      </div>
    );
  }

  const programName = program?.name ?? "Deleted program";

  const handleFinish = () => {
    const command: Command = {
      type: "FINISH_WORKOUT",
      payload: { workoutId, navigateTo: `/workout/summary?workoutId=${encodeURIComponent(workoutId)}` },
    };
    openConfirm({
      title: "End workout?",
      message: "Finish now to lock this workout into history.",
      confirmLabel: "Finish",
      command,
    });
  };

  return (
    <div className="page container">
      <div
        className={`runner-header ${
          vtHero?.type === "program" && program && vtHero.id === program.id ? "vt-hero" : ""
        }`}
      >
        <div className="runner-header__row">
          <div>
            <div className="muted">Workout Runner</div>
            <div className="runner-header__title">{programName}</div>
          </div>
          <button type="button" className="button button--primary" onClick={handleFinish}>
            Finish
          </button>
        </div>
      </div>

      <section className="page__section virtual-list list-surface">
        {workout.entries.map((entry) => {
          const exercise = exerciseById.get(entry.exerciseId);
          if (!exercise) return null;
          return (
            <ExerciseCard
              key={entry.exerciseId}
              exercise={exercise}
              entry={entry}
              barWeight={settings.defaultBarWeight}
              onEditSet={(setId) => openEditSet({ workoutId, exerciseId: entry.exerciseId, setId })}
              onDeleteSet={(setId) => {
                // Per improve-1.md: ultra-frequent actions must NOT use view transitions
                const payload = deleteSet(workoutId, entry.exerciseId, setId);
                if (payload) {
                  showSnackbar("Set deleted", "Undo", { type: "UNDO_DELETE_SET", payload });
                }
              }}
              onAddSet={() => {
                const id = addSet(workoutId, entry.exerciseId);
                if (id) setLastAddedSetId(id);
              }}
              highlightedSetId={lastAddedSetId}
            />
          );
        })}
      </section>
      <BackButton />
    </div>
  );
}
