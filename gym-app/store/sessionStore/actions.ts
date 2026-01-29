/**
 * Session store actions - workout and set CRUD operations.
 * All actions return void and update state via Zustand set().
 */

import type { Exercise, Program, Settings, SetEntry } from "../../types/gym";
import type {
  SessionEntityState,
  SessionEntry,
  SessionSet,
  SessionWorkout,
  UndoDeleteSetPayload,
} from "../../types/session";
import type { SyncEvent } from "../../sync/outbox";
import { createId } from "../../app/shared/lib/utils";
import {
  buildWorkoutEntries,
  createDefaultSet,
  getEntryId,
  insertSortedWorkoutId,
  normalizeWorkouts,
} from "./normalization";

export type PendingSyncEvent = {
  event: Omit<SyncEvent, "id" | "createdAt">;
  nonce: string;
};

export const createPendingSyncEvent = (event: PendingSyncEvent["event"]): PendingSyncEvent => ({
  event,
  nonce: createId(),
});

export type SessionActions = {
  startWorkout: (programId: string) => string;
  finishWorkout: (workoutId: string) => void;
  updateSet: (workoutId: string, exerciseId: string, setId: string, patch: Partial<SetEntry>) => void;
  addSet: (workoutId: string, exerciseId: string) => string | undefined;
  deleteSet: (workoutId: string, exerciseId: string, setId: string) => UndoDeleteSetPayload | null;
  restoreDeletedSet: (payload: UndoDeleteSetPayload) => void;
  replaceFromWorkouts: (workouts: import("../../types/gym").Workout[]) => void;
  clearSession: () => void;
};

type GetState = () => SessionEntityState & { pendingSyncEvent: PendingSyncEvent | null };
type SetState = (
  partial:
    | Partial<SessionEntityState & { pendingSyncEvent: PendingSyncEvent | null }>
    | ((
        state: SessionEntityState & { pendingSyncEvent: PendingSyncEvent | null }
      ) => Partial<SessionEntityState & { pendingSyncEvent: PendingSyncEvent | null }>),
  replace: boolean
) => void;

export type SessionDeps = {
  getSettings: () => Settings;
  getCatalog: () => { programs: Program[]; exercises: Exercise[] };
};

export const createActions = (
  set: SetState,
  get: GetState,
  deps: SessionDeps
): SessionActions => ({
  startWorkout: (programId) => {
    const { programs, exercises } = deps.getCatalog();
    const settings = deps.getSettings();
    const program = programs.find((item) => item.id === programId);
    if (!program) return "";

    const workoutId = createId();
    const workout: SessionWorkout = {
      id: workoutId,
      programId,
      startedAt: Date.now(),
    };

    const { entryIds, entriesById, setsById, setIdsByEntryId } = buildWorkoutEntries(
      workoutId,
      program,
      exercises,
      settings,
      get()
    );

    set(
      (state) => {
        const workoutsById = { ...state.workoutsById, [workoutId]: workout };
        const workoutIds = insertSortedWorkoutId(state.workoutIds, workoutsById, workout);
        return {
          activeWorkoutId: workoutId,
          workoutsById,
          entriesById: { ...state.entriesById, ...entriesById },
          setsById: { ...state.setsById, ...setsById },
          entryIdsByWorkoutId: { ...state.entryIdsByWorkoutId, [workoutId]: entryIds },
          setIdsByEntryId: { ...state.setIdsByEntryId, ...setIdsByEntryId },
          workoutIds,
          pendingSyncEvent: createPendingSyncEvent({
            type: "WORKOUT_STARTED",
            payload: { workoutId, programId },
          }),
        };
      },
      false
    );
    return workoutId;
  },

  finishWorkout: (workoutId) => {
    set(
      (state) => {
        const workout = state.workoutsById[workoutId];
        if (!workout) return state;
        const updated = { ...workout, endedAt: Date.now() };
        const workoutsById = { ...state.workoutsById, [workoutId]: updated };
        const workoutIds = insertSortedWorkoutId(state.workoutIds, workoutsById, updated);
        return {
          workoutsById,
          workoutIds,
          activeWorkoutId: state.activeWorkoutId === workoutId ? null : state.activeWorkoutId,
          pendingSyncEvent: createPendingSyncEvent({
            type: "WORKOUT_FINISHED",
            payload: { workoutId },
          }),
        };
      },
      false
    );
  },

  updateSet: (_workoutId, _exerciseId, setId, patch) => {
    set(
      (state) => {
        const setEntry = state.setsById[setId];
        if (!setEntry) return state;
        return {
          setsById: {
            ...state.setsById,
            [setId]: { ...setEntry, ...patch },
          },
          pendingSyncEvent: createPendingSyncEvent({
            type: "SET_UPDATED",
            payload: { setId },
          }),
        };
      },
      false
    );
  },

  addSet: (workoutId, exerciseId) => {
    const settings = deps.getSettings();
    const { exercises } = deps.getCatalog();
    const entryId = getEntryId(workoutId, exerciseId);
    let addedSetId: string | undefined;
    set(
      (state) => {
        const currentSetIds = state.setIdsByEntryId[entryId] ?? [];
        const lastSetId = currentSetIds[currentSetIds.length - 1];
        const lastSet = lastSetId ? state.setsById[lastSetId] : undefined;
        const exercise = exercises.find((item) => item.id === exerciseId);
        const nextSet: SessionSet = lastSet
          ? { ...lastSet, id: createId() }
          : createDefaultSet(exercise?.defaultInputMode ?? "total", settings);
        addedSetId = nextSet.id;
        return {
          setsById: { ...state.setsById, [nextSet.id]: nextSet },
          setIdsByEntryId: {
            ...state.setIdsByEntryId,
            [entryId]: [...currentSetIds, nextSet.id],
          },
          pendingSyncEvent: createPendingSyncEvent({
            type: "SET_ADDED",
            payload: { workoutId, exerciseId },
          }),
        };
      },
      false
    );
    return addedSetId;
  },

  deleteSet: (workoutId, exerciseId, setId) => {
    const entryId = getEntryId(workoutId, exerciseId);
    const state = get();
    const currentSetIds = state.setIdsByEntryId[entryId] ?? [];
    const setIndex = currentSetIds.indexOf(setId);
    const removed = state.setsById[setId];
    if (!removed || setIndex === -1) return null;

    set(
      (current) => {
        const nextSetIds = current.setIdsByEntryId[entryId]?.filter((id) => id !== setId) ?? [];
        const nextSetsById = { ...current.setsById };
        delete nextSetsById[setId];
        return {
          setsById: nextSetsById,
          setIdsByEntryId: {
            ...current.setIdsByEntryId,
            [entryId]: nextSetIds,
          },
          pendingSyncEvent: createPendingSyncEvent({
            type: "SET_DELETED",
            payload: { setId },
          }),
        };
      },
      false
    );

    return { workoutId, exerciseId, set: removed, index: setIndex };
  },

  restoreDeletedSet: (payload) => {
    const entryId = getEntryId(payload.workoutId, payload.exerciseId);
    set(
      (state) => {
        const currentSetIds = state.setIdsByEntryId[entryId] ?? [];
        if (currentSetIds.includes(payload.set.id)) return state;
        const nextSetIds = [...currentSetIds];
        const insertAt = Math.min(Math.max(payload.index, 0), nextSetIds.length);
        nextSetIds.splice(insertAt, 0, payload.set.id);
        return {
          setsById: { ...state.setsById, [payload.set.id]: payload.set },
          setIdsByEntryId: {
            ...state.setIdsByEntryId,
            [entryId]: nextSetIds,
          },
          pendingSyncEvent: createPendingSyncEvent({
            type: "SET_RESTORED",
            payload: { setId: payload.set.id },
          }),
        };
      },
      false
    );
  },

  replaceFromWorkouts: (workouts) => {
    const normalized = normalizeWorkouts(workouts);
    set({ ...normalized, pendingSyncEvent: null }, false);
  },

  clearSession: () => {
    const cleared: SessionEntityState = {
      activeWorkoutId: null,
      workoutsById: {},
      entriesById: {},
      setsById: {},
      entryIdsByWorkoutId: {},
      setIdsByEntryId: {},
      workoutIds: [],
    };
    set(
      {
        ...cleared,
        pendingSyncEvent: null,
      },
      false
    );
  },
});
