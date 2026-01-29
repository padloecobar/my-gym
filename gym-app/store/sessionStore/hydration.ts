/**
 * Session store hydration logic.
 * Loads persisted state from storage or migrates legacy workouts.
 */

import type { StorageAdapter } from "../../storage/adapter";
import type { SessionEntityState } from "../../types/session";
import { normalizeWorkouts } from "./normalization";

export const SESSION_SCHEMA_VERSION = 1;

const migrateSessionState = (state: SessionEntityState, fromVersion: number): SessionEntityState => {
  if (fromVersion === SESSION_SCHEMA_VERSION) return state;
  // Future migrations go here
  return state;
};

type HydrateSetState = (
  partial: Partial<SessionEntityState & { hasHydrated: boolean; lastHydratedAt?: number }>,
  replace: boolean
) => void;

type HydrateGetState = () => { hasHydrated: boolean };

export const createHydrate = (storage: StorageAdapter, set: HydrateSetState, get: HydrateGetState) => {
  return async () => {
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

    // Fallback: migrate from legacy workouts storage
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
  };
};
