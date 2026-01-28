import type { SetEntry } from "./gym";

export type SessionWorkout = {
  id: string;
  programId: string;
  startedAt: number;
  endedAt?: number;
};

export type SessionEntry = {
  id: string;
  workoutId: string;
  exerciseId: string;
  suggested: boolean;
};

export type SessionSet = SetEntry;

export type SessionEntityState = {
  activeWorkoutId: string | null;
  workoutsById: Record<string, SessionWorkout>;
  entriesById: Record<string, SessionEntry>;
  setsById: Record<string, SessionSet>;
  entryIdsByWorkoutId: Record<string, string[]>;
  setIdsByEntryId: Record<string, string[]>;
  workoutIds: string[];
};

export type UndoDeleteSetPayload = {
  workoutId: string;
  exerciseId: string;
  set: SessionSet;
  index: number;
};
