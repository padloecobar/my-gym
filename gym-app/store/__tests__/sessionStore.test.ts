import { describe, expect, it } from "vitest";
import { createCatalogStore } from "../catalogStore";
import { createSessionStore } from "../sessionStore";
import { createSettingsStore } from "../settingsStore";
import { createMemoryStorage } from "../../storage/memory";
import type { Workout } from "../../types/gym";

const setupStores = () => {
  const storage = createMemoryStorage();
  const settingsStore = createSettingsStore(storage);
  const catalogStore = createCatalogStore(storage);

  settingsStore.getState().replaceSettings({ unitsPreference: "kg", defaultBarWeight: 20 });
  catalogStore.getState().replaceCatalog(
    [{ id: "program-1", name: "Test Program", exerciseIds: ["exercise-1"] }],
    [{ id: "exercise-1", name: "Squat", type: "Barbell", defaultInputMode: "plates" }]
  );

  const sessionStore = createSessionStore({
    storage,
    getSettings: () => settingsStore.getState().settings,
    getCatalog: () => ({
      programs: catalogStore.getState().programs,
      exercises: catalogStore.getState().exercises,
    }),
  });

  return { storage, settingsStore, catalogStore, sessionStore };
};

describe("sessionStore", () => {
  it("startWorkout creates active workout with default set", () => {
    const { sessionStore } = setupStores();

    const workoutId = sessionStore.getState().startWorkout("program-1");
    const state = sessionStore.getState();

    expect(state.activeWorkoutId).toBe(workoutId);
    expect(state.workoutsById[workoutId]).toBeTruthy();

    const entryIds = state.entryIdsByWorkoutId[workoutId];
    expect(entryIds).toHaveLength(1);

    const setIds = state.setIdsByEntryId[entryIds[0]];
    expect(setIds).toHaveLength(1);

    const setEntry = state.setsById[setIds[0]];
    expect(setEntry.weightKg).toBe(20);
  });

  it("addSet, deleteSet, restoreDeletedSet", () => {
    const { sessionStore } = setupStores();
    const workoutId = sessionStore.getState().startWorkout("program-1");

    const newSetId = sessionStore.getState().addSet(workoutId, "exercise-1");
    let state = sessionStore.getState();

    const entryId = state.entryIdsByWorkoutId[workoutId][0];
    const setIds = state.setIdsByEntryId[entryId];
    expect(setIds).toHaveLength(2);
    expect(newSetId).toBe(setIds[1]);

    const targetSetId = setIds[0];
    const undoPayload = sessionStore.getState().deleteSet(workoutId, "exercise-1", targetSetId);
    state = sessionStore.getState();
    expect(state.setsById[targetSetId]).toBeUndefined();
    expect(undoPayload).not.toBeNull();

    if (undoPayload) {
      sessionStore.getState().restoreDeletedSet(undoPayload);
      state = sessionStore.getState();
      expect(state.setsById[targetSetId]).toBeTruthy();
    }
  });

  it("finishWorkout sets endedAt and clears activeWorkoutId", () => {
    const { sessionStore } = setupStores();
    const workoutId = sessionStore.getState().startWorkout("program-1");

    sessionStore.getState().finishWorkout(workoutId);
    const state = sessionStore.getState();

    expect(state.workoutsById[workoutId].endedAt).toBeTypeOf("number");
    expect(state.activeWorkoutId).toBeNull();
  });

  it("hydrate migrates legacy workouts and is idempotent", async () => {
    const storage = createMemoryStorage();
    const legacyWorkout: Workout = {
      id: "legacy-1",
      programId: "program-1",
      startedAt: Date.now(),
      entries: [
        {
          exerciseId: "exercise-1",
          suggested: false,
          sets: [
            { id: "set-1", weightKg: 60, reps: 5, mode: "total" },
          ],
        },
      ],
    };
    await storage.putLegacyWorkout(legacyWorkout);

    const settingsStore = createSettingsStore(storage);
    const catalogStore = createCatalogStore(storage);
    settingsStore.getState().replaceSettings({ unitsPreference: "kg", defaultBarWeight: 20 });
    catalogStore.getState().replaceCatalog(
      [{ id: "program-1", name: "Test Program", exerciseIds: ["exercise-1"] }],
      [{ id: "exercise-1", name: "Squat", type: "Barbell", defaultInputMode: "plates" }]
    );

    const sessionStore = createSessionStore({
      storage,
      getSettings: () => settingsStore.getState().settings,
      getCatalog: () => ({
        programs: catalogStore.getState().programs,
        exercises: catalogStore.getState().exercises,
      }),
    });

    await sessionStore.getState().hydrate();
    const firstHydration = sessionStore.getState();
    expect(firstHydration.workoutsById["legacy-1"]).toBeTruthy();
    expect(firstHydration.entryIdsByWorkoutId["legacy-1"]).toHaveLength(1);

    await sessionStore.getState().hydrate();
    const secondHydration = sessionStore.getState();
    expect(secondHydration.workoutIds).toEqual(firstHydration.workoutIds);
  });
});
