/**
 * Normalization utilities for session store entities.
 * Converts between nested Workout[] and flat normalized state.
 */

import type { Exercise, InputMode, Program, Settings, Workout } from "../../types/gym";
import type {
  SessionEntityState,
  SessionEntry,
  SessionSet,
  SessionWorkout,
} from "../../types/session";
import { createId } from "../../app/shared/lib/utils";
import type { SetEntry } from "../../types/gym";

export const getEntryId = (workoutId: string, exerciseId: string) => `${workoutId}:${exerciseId}`;

export const createDefaultSet = (mode: InputMode, settings: Settings): SetEntry => {
  const weight = mode === "plates" ? settings.defaultBarWeight : 0;
  return {
    id: createId(),
    weightKg: weight,
    reps: 8,
    mode,
  };
};

export const workoutSortKey = (workout: SessionWorkout) => workout.endedAt ?? workout.startedAt;

export const insertSortedWorkoutId = (
  workoutIds: string[],
  workoutsById: Record<string, SessionWorkout>,
  workout: SessionWorkout
) => {
  const next = workoutIds.filter((id) => id !== workout.id);
  const key = workoutSortKey(workout);
  let insertAt = 0;
  for (; insertAt < next.length; insertAt += 1) {
    const candidate = workoutsById[next[insertAt]];
    if (!candidate) continue;
    if (workoutSortKey(candidate) < key) break;
  }
  next.splice(insertAt, 0, workout.id);
  return next;
};

/**
 * Normalizes nested Workout[] into flat entity dictionaries.
 * Used for hydration and bulk updates.
 */
export const normalizeWorkouts = (workouts: Workout[]): SessionEntityState => {
  const workoutsById: Record<string, SessionWorkout> = {};
  const entriesById: Record<string, SessionEntry> = {};
  const setsById: Record<string, SessionSet> = {};
  const entryIdsByWorkoutId: Record<string, string[]> = {};
  const setIdsByEntryId: Record<string, string[]> = {};
  const workoutIds: string[] = [];

  workouts.forEach((workout) => {
    workoutsById[workout.id] = {
      id: workout.id,
      programId: workout.programId,
      startedAt: workout.startedAt,
      endedAt: workout.endedAt,
    };
    workoutIds.push(workout.id);
    const entryIds: string[] = [];
    workout.entries.forEach((entry) => {
      const entryId = getEntryId(workout.id, entry.exerciseId);
      entryIds.push(entryId);
      entriesById[entryId] = {
        id: entryId,
        workoutId: workout.id,
        exerciseId: entry.exerciseId,
        suggested: entry.suggested,
      };
      const setIds = entry.sets.map((set) => set.id);
      setIdsByEntryId[entryId] = setIds;
      entry.sets.forEach((set) => {
        setsById[set.id] = { id: set.id, weightKg: set.weightKg, reps: set.reps, mode: set.mode };
      });
    });
    entryIdsByWorkoutId[workout.id] = entryIds;
  });

  workoutIds.sort((a, b) => {
    const aWorkout = workoutsById[a];
    const bWorkout = workoutsById[b];
    if (!aWorkout || !bWorkout) return 0;
    return workoutSortKey(bWorkout) - workoutSortKey(aWorkout);
  });

  const activeWorkoutId = workoutIds.find((id) => !workoutsById[id]?.endedAt) ?? null;

  return {
    activeWorkoutId,
    workoutsById,
    entriesById,
    setsById,
    entryIdsByWorkoutId,
    setIdsByEntryId,
    workoutIds,
  };
};

/**
 * Builds workout entries for a new workout, optionally copying suggested sets from previous workout.
 */
export const buildWorkoutEntries = (
  workoutId: string,
  program: Program,
  exercises: Exercise[],
  settings: Settings,
  state: SessionEntityState
) => {
  const entriesById: Record<string, SessionEntry> = {};
  const setsById: Record<string, SessionSet> = {};
  const setIdsByEntryId: Record<string, string[]> = {};
  const entryIds: string[] = [];

  const latestCompletedId = state.workoutIds.find((id) => {
    const workout = state.workoutsById[id];
    return workout?.programId === program.id && workout.endedAt;
  });

  program.exerciseIds.forEach((exerciseId) => {
    const entryId = getEntryId(workoutId, exerciseId);
    entryIds.push(entryId);
    const exercise = exercises.find((item) => item.id === exerciseId);

    let suggestedSets: SessionSet[] = [];
    if (latestCompletedId) {
      const previousEntryId = getEntryId(latestCompletedId, exerciseId);
      const previousSetIds = state.setIdsByEntryId[previousEntryId] ?? [];
      const previousSets = previousSetIds
        .map((setId) => state.setsById[setId])
        .filter((set): set is SessionSet => Boolean(set));
      if (previousSets.length > 0) {
        suggestedSets = previousSets.map((set) => ({
          ...set,
          id: createId(),
        }));
      }
    }

    const sets =
      suggestedSets.length > 0
        ? suggestedSets
        : [createDefaultSet(exercise?.defaultInputMode ?? "total", settings)];

    entriesById[entryId] = {
      id: entryId,
      workoutId,
      exerciseId,
      suggested: suggestedSets.length > 0,
    };

    setIdsByEntryId[entryId] = sets.map((set) => set.id);
    sets.forEach((set) => {
      setsById[set.id] = set;
    });
  });

  return { entryIds, entriesById, setsById, setIdsByEntryId };
};
