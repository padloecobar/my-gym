import type { Exercise, Program, Workout } from "../types/gym";
import type { SessionEntityState } from "../types/session";
import type { MetaRecord, SettingsRecord, SessionRecord, StorageAdapter } from "./adapter";

export const createMemoryStorage = (): StorageAdapter => {
  let settings: SettingsRecord | null = null;
  let session: SessionRecord | null = null;
  const programs = new Map<string, Program>();
  const exercises = new Map<string, Exercise>();
  const workouts = new Map<string, Workout>();
  const meta = new Map<string, MetaRecord>();
  const kv = new Map<string, unknown>();

  return {
    getSettings: async () => settings,
    setSettings: async (record) => {
      settings = record;
    },
    getItem: async <T = unknown>(key: string) => {
      return (kv.get(key) as T | undefined) ?? null;
    },
    setItem: async (key, value) => {
      kv.set(key, value);
    },
    removeItem: async (key) => {
      kv.delete(key);
    },
    getPrograms: async () => Array.from(programs.values()),
    getExercises: async () => Array.from(exercises.values()),
    putProgram: async (program) => {
      programs.set(program.id, program);
    },
    putExercise: async (exercise) => {
      exercises.set(exercise.id, exercise);
    },
    deleteProgram: async (id) => {
      programs.delete(id);
    },
    deleteExercise: async (id) => {
      exercises.delete(id);
    },
    clearPrograms: async () => {
      programs.clear();
    },
    clearExercises: async () => {
      exercises.clear();
    },
    getSessionSnapshot: async () => session,
    setSessionSnapshot: async (record) => {
      session = record as SessionRecord;
    },
    clearSessionSnapshot: async () => {
      session = null;
    },
    getLegacyWorkouts: async () => Array.from(workouts.values()),
    putLegacyWorkout: async (workout) => {
      workouts.set(workout.id, workout);
    },
    clearLegacyWorkouts: async () => {
      workouts.clear();
    },
    getMeta: async (id) => meta.get(id) ?? null,
    setMeta: async (record) => {
      meta.set(record.id, record);
    },
  };
};

export const seedMemorySession = (storage: StorageAdapter, state: SessionEntityState) => {
  return storage.setSessionSnapshot({
    id: "session",
    schemaVersion: 1,
    value: state,
    updatedAt: Date.now(),
  });
};
