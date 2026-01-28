import type { Workout, WorkoutEntry } from "../../types/gym";
import type { SessionState } from "../sessionStore";

export const selectActiveWorkoutId = (state: SessionState) => state.activeWorkoutId;

export const buildWorkoutFromState = (state: SessionState, workoutId: string): Workout | null => {
  const workout = state.workoutsById[workoutId];
  if (!workout) return null;
  const entryIds = state.entryIdsByWorkoutId[workoutId] ?? [];
  const entries: WorkoutEntry[] = entryIds
    .map((entryId) => {
      const entry = state.entriesById[entryId];
      if (!entry) return null;
      const setIds = state.setIdsByEntryId[entryId] ?? [];
      const sets = setIds
        .map((setId) => state.setsById[setId])
        .filter((set) => Boolean(set));
      return {
        exerciseId: entry.exerciseId,
        suggested: entry.suggested,
        sets,
      };
    })
    .filter((entry): entry is WorkoutEntry => Boolean(entry));
  return {
    id: workout.id,
    programId: workout.programId,
    startedAt: workout.startedAt,
    endedAt: workout.endedAt,
    entries,
  };
};

export const buildWorkoutsForExport = (state: SessionState): Workout[] => {
  return state.workoutIds
    .map((workoutId) => buildWorkoutFromState(state, workoutId))
    .filter((workout): workout is Workout => Boolean(workout));
};

export const makeWorkoutViewSelector = (workoutId: string) => {
  let lastWorkout = undefined as SessionState["workoutsById"][string] | undefined;
  let lastEntryIds: string[] | undefined;
  let lastEntriesById: SessionState["entriesById"] | undefined;
  let lastSetIdsByEntryId: SessionState["setIdsByEntryId"] | undefined;
  let lastSetsById: SessionState["setsById"] | undefined;
  let lastResult: Workout | null = null;

  return (state: SessionState) => {
    const workout = state.workoutsById[workoutId];
    if (!workout) return null;
    const entryIds = state.entryIdsByWorkoutId[workoutId] ?? [];

    if (
      workout === lastWorkout &&
      entryIds === lastEntryIds &&
      state.entriesById === lastEntriesById &&
      state.setIdsByEntryId === lastSetIdsByEntryId &&
      state.setsById === lastSetsById
    ) {
      return lastResult;
    }

    const next = buildWorkoutFromState(state, workoutId);
    lastWorkout = workout;
    lastEntryIds = entryIds;
    lastEntriesById = state.entriesById;
    lastSetIdsByEntryId = state.setIdsByEntryId;
    lastSetsById = state.setsById;
    lastResult = next;
    return next;
  };
};

export const getWorkoutStats = (workout: Workout | null) => {
  if (!workout) {
    return { totalSets: 0, totalVolume: 0, exercisesCompleted: 0 };
  }
  const allSets = workout.entries.flatMap((entry) => entry.sets);
  const totalSets = allSets.length;
  const totalVolume = allSets.reduce((total, set) => total + set.weightKg * set.reps, 0);
  const exercisesCompleted = workout.entries.filter((entry) => entry.sets.some((set) => set.completed)).length;
  return { totalSets, totalVolume, exercisesCompleted };
};
