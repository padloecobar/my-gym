import type { GymExport } from "../types/gym";
import { defaultSettings, seedExercises, seedPrograms } from "../app/shared/lib/seed";
import type { CatalogStore, SessionStore, SettingsStore } from "./AppStoreProvider";
import { buildWorkoutsForExport } from "./selectors/sessionSelectors";

export type AppActionDeps = {
  settingsStore: SettingsStore;
  catalogStore: CatalogStore;
  sessionStore: SessionStore;
};

export const createAppActions = ({ settingsStore, catalogStore, sessionStore }: AppActionDeps) => {
  const exportData = async (): Promise<GymExport> => {
    const settings = settingsStore.getState().settings;
    const programs = catalogStore.getState().programs;
    const exercises = catalogStore.getState().exercises;
    const workouts = buildWorkoutsForExport(sessionStore.getState());
    return { programs, exercises, workouts, settings };
  };

  const importData = async (payload: GymExport): Promise<void> => {
    settingsStore.getState().replaceSettings(payload.settings);
    catalogStore.getState().replaceCatalog(payload.programs, payload.exercises);
    sessionStore.getState().replaceFromWorkouts(payload.workouts);
  };

  const resetAll = async (): Promise<void> => {
    const exercises = seedExercises();
    const programs = seedPrograms(exercises.map((exercise) => exercise.id));
    settingsStore.getState().replaceSettings(defaultSettings);
    catalogStore.getState().replaceCatalog(programs, exercises);
    sessionStore.getState().clearSession();
  };

  return { exportData, importData, resetAll };
};
