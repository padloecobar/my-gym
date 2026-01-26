import { useCallback, useEffect, useState } from "react";

import { useDbChange } from "./useDbChange";
import { dbService } from "../../lib/db/service";

import type { Exercise, WorkoutId } from "../../lib/types";

const EXERCISE_SOURCES = new Set([
  "saveExercise",
  "saveExercises",
  "deleteExercise",
  "reorderExercises",
  "clearAllData",
]);

type UseExercisesState = {
  exercises: Exercise[];
  loading: boolean;
  error: string | null;
};

type UseExercisesActions = {
  refresh: () => Promise<void>;
  saveExercise: (exercise: Exercise) => Promise<void>;
  saveExercises: (exercises: Exercise[]) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  reorderExercises: (workout: WorkoutId, orderedIds: string[]) => Promise<void>;
};

export const useExercises = (): UseExercisesState & UseExercisesActions => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dbService.getAllExercises();
      setExercises(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load exercises");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useDbChange(
    useCallback(
      (detail) => {
        if (!EXERCISE_SOURCES.has(detail.source)) return;
        void refresh();
      },
      [refresh],
    ),
  );

  return {
    exercises,
    loading,
    error,
    refresh,
    saveExercise: (exercise) => dbService.saveExercise(exercise),
    saveExercises: (items) => dbService.saveExercises(items),
    deleteExercise: (id) => dbService.deleteExercise(id),
    reorderExercises: (workout, orderedIds) =>
      dbService.reorderExercises(workout, orderedIds),
  };
};
