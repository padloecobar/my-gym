import { createStore } from "zustand/vanilla";
import type { Exercise, InputMode, Program, SetEntry, Settings, Workout } from "../types/gym";
import type { SessionEntityState, SessionEntry, SessionSet, SessionWorkout, UndoDeleteSetPayload } from "../types/session";
import { createId } from "../lib/utils";
import type { StorageAdapter } from "../storage/adapter";
import { indexedDbStorage } from "../storage/adapter";
import type { SyncEvent } from "../sync/outbox";

export const SESSION_SCHEMA_VERSION = 1;

export type PendingSyncEvent = {
  event: Omit<SyncEvent, "id" | "createdAt">;
  nonce: string;
};

const getEntryId = (workoutId: string, exerciseId: string) => `${workoutId}:${exerciseId}`;

const createDefaultSet = (mode: InputMode, settings: Settings): SetEntry => {
  const weight = mode === "plates" ? settings.defaultBarWeight : 0;
  return {
    id: createId(),
    weightKg: weight,
    reps: 8,
    mode,
  };
};

const workoutSortKey = (workout: SessionWorkout) => workout.endedAt ?? workout.startedAt;

const insertSortedWorkoutId = (
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

const normalizeWorkouts = (workouts: Workout[]): SessionEntityState => {
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

const migrateSessionState = (state: SessionEntityState, fromVersion: number): SessionEntityState => {
  if (fromVersion === SESSION_SCHEMA_VERSION) return state;
  return state;
};

const buildWorkoutEntries = (
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

const createPendingSyncEvent = (event: PendingSyncEvent["event"]): PendingSyncEvent => ({
  event,
  nonce: createId(),
});

export type SessionState = SessionEntityState & {
  schemaVersion: number;
  hasHydrated: boolean;
  lastHydratedAt?: number;
  pendingSyncEvent: PendingSyncEvent | null;
  legacyClearToken: number;
  hydrate: () => Promise<void>;
  startWorkout: (programId: string) => string;
  finishWorkout: (workoutId: string) => void;
  updateSet: (workoutId: string, exerciseId: string, setId: string, patch: Partial<SetEntry>) => void;
  addSet: (workoutId: string, exerciseId: string) => string | undefined;
  deleteSet: (workoutId: string, exerciseId: string, setId: string) => UndoDeleteSetPayload | null;
  restoreDeletedSet: (payload: UndoDeleteSetPayload) => void;
  replaceFromWorkouts: (workouts: Workout[]) => void;
  clearSession: () => void;
};

export type SessionDependencies = {
  storage?: StorageAdapter;
  getSettings: () => Settings;
  getCatalog: () => { programs: Program[]; exercises: Exercise[] };
};

export const createSessionStore = ({
  storage = indexedDbStorage,
  getSettings,
  getCatalog,
}: SessionDependencies) =>
  createStore<SessionState>((set, get) => ({
    schemaVersion: SESSION_SCHEMA_VERSION,
    hasHydrated: false,
    lastHydratedAt: undefined,
    pendingSyncEvent: null,
    legacyClearToken: 0,
    activeWorkoutId: null,
    workoutsById: {},
    entriesById: {},
    setsById: {},
    entryIdsByWorkoutId: {},
    setIdsByEntryId: {},
    workoutIds: [],
    hydrate: async () => {
      if (get().hasHydrated) return;
      const record = await storage.getSessionSnapshot();
      if (record) {
        const value = migrateSessionState(record.value, record.schemaVersion);
        set(
          {
            ...value,
            hasHydrated: true,
            lastHydratedAt: Date.now(),
          },
          false
        );
        return;
      }

      const legacyWorkouts = await storage.getLegacyWorkouts();
      const normalized = normalizeWorkouts(legacyWorkouts);
      set(
        {
          ...normalized,
          hasHydrated: true,
          lastHydratedAt: Date.now(),
        },
        false
      );
    },
    startWorkout: (programId) => {
      const { programs, exercises } = getCatalog();
      const settings = getSettings();
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
      const settings = getSettings();
      const { exercises } = getCatalog();
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
          legacyClearToken: Date.now(),
        },
        false
      );
    },
  }));

export const selectSessionSnapshot = (state: SessionState): SessionEntityState => ({
  activeWorkoutId: state.activeWorkoutId,
  workoutsById: state.workoutsById,
  entriesById: state.entriesById,
  setsById: state.setsById,
  entryIdsByWorkoutId: state.entryIdsByWorkoutId,
  setIdsByEntryId: state.setIdsByEntryId,
  workoutIds: state.workoutIds,
});
