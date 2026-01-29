/**
 * Session store - normalized entity state for workouts, entries, and sets.
 * Split into modules for maintainability:
 * - normalization.ts: Entity normalization/denormalization
 * - actions.ts: CRUD operations
 * - hydration.ts: Storage persistence and migration
 */

import { createStore } from "zustand/vanilla";
import type { SessionEntityState } from "../../types/session";
import type { StorageAdapter } from "../../storage/adapter";
import { indexedDbStorage } from "../../storage/adapter";
import { createActions, type SessionActions, type SessionDeps, type PendingSyncEvent } from "./actions";
import { createHydrate, SESSION_SCHEMA_VERSION } from "./hydration";

export { SESSION_SCHEMA_VERSION } from "./hydration";
export type { PendingSyncEvent } from "./actions";

export type SessionState = SessionEntityState & {
  schemaVersion: number;
  hasHydrated: boolean;
  lastHydratedAt?: number;
  pendingSyncEvent: PendingSyncEvent | null;
  legacyClearToken: number;
  hydrate: () => Promise<void>;
} & SessionActions;

export type SessionDependencies = SessionDeps & {
  storage?: StorageAdapter;
};

export const createSessionStore = ({
  storage = indexedDbStorage,
  getSettings,
  getCatalog,
}: SessionDependencies) =>
  createStore<SessionState>((set, get) => {
    const actions = createActions(
      set as any,
      get as any,
      { getSettings, getCatalog }
    );

    const hydrate = createHydrate(
      storage,
      set as any,
      get as any
    );

    return {
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
      hydrate,
      ...actions,
    };
  });

/**
 * Selector to extract just the entity state (for persistence).
 */
export const selectSessionSnapshot = (state: SessionState): SessionEntityState => ({
  activeWorkoutId: state.activeWorkoutId,
  workoutsById: state.workoutsById,
  entriesById: state.entriesById,
  setsById: state.setsById,
  entryIdsByWorkoutId: state.entryIdsByWorkoutId,
  setIdsByEntryId: state.setIdsByEntryId,
  workoutIds: state.workoutIds,
});
