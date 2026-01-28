import type { Exercise, Program, Settings, Workout } from "../types/gym";
import type { SessionEntityState } from "../types/session";
import { clearStore, deleteById, getAll, getById, put } from "./indexeddb";

export type VersionedRecord<T> = {
  id: string;
  schemaVersion: number;
  value: T;
  updatedAt?: number;
};

export type SettingsRecord = VersionedRecord<Settings>;
export type SessionRecord = VersionedRecord<SessionEntityState>;

export type MetaRecord = {
  id: string;
  value: {
    schemaVersion: number;
    updatedAt?: number;
  };
};

export type KeyValueRecord = {
  id: string;
  value: unknown;
};

export type StorageAdapter = {
  getSettings: () => Promise<SettingsRecord | null>;
  setSettings: (record: SettingsRecord) => Promise<void>;
  getItem: <T = unknown>(key: string) => Promise<T | null>;
  setItem: (key: string, value: unknown) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  getPrograms: () => Promise<Program[]>;
  getExercises: () => Promise<Exercise[]>;
  putProgram: (program: Program) => Promise<void>;
  putExercise: (exercise: Exercise) => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  clearPrograms: () => Promise<void>;
  clearExercises: () => Promise<void>;
  getSessionSnapshot: () => Promise<SessionRecord | null>;
  setSessionSnapshot: (record: SessionRecord) => Promise<void>;
  clearSessionSnapshot: () => Promise<void>;
  getLegacyWorkouts: () => Promise<Workout[]>;
  putLegacyWorkout: (workout: Workout) => Promise<void>;
  clearLegacyWorkouts: () => Promise<void>;
  getMeta: (id: string) => Promise<MetaRecord | null>;
  setMeta: (record: MetaRecord) => Promise<void>;
};

const guard = async <T>(fallback: T, action: () => Promise<T>): Promise<T> => {
  if (typeof window === "undefined") return fallback;
  try {
    return await action();
  } catch {
    return fallback;
  }
};

export const indexedDbStorage: StorageAdapter = {
  getSettings: () =>
    guard<SettingsRecord | null>(null, async () => (await getById<SettingsRecord>("settings", "settings")) ?? null),
  setSettings: (record) => guard(undefined, () => put("settings", record)),
  getItem: <T = unknown>(key: string) =>
    guard<T | null>(null, async () => {
      const record = await getById<KeyValueRecord>("meta", key);
      return (record?.value as T) ?? null;
    }),
  setItem: (key, value) => guard(undefined, () => put("meta", { id: key, value })),
  removeItem: (key) => guard(undefined, () => deleteById("meta", key)),
  getPrograms: () => guard<Program[]>([], () => getAll<Program>("programs")),
  getExercises: () => guard<Exercise[]>([], () => getAll<Exercise>("exercises")),
  putProgram: (program) => guard(undefined, () => put("programs", program)),
  putExercise: (exercise) => guard(undefined, () => put("exercises", exercise)),
  deleteProgram: (id) => guard(undefined, () => deleteById("programs", id)),
  deleteExercise: (id) => guard(undefined, () => deleteById("exercises", id)),
  clearPrograms: () => guard(undefined, () => clearStore("programs")),
  clearExercises: () => guard(undefined, () => clearStore("exercises")),
  getSessionSnapshot: () =>
    guard<SessionRecord | null>(null, async () => (await getById<SessionRecord>("session", "session")) ?? null),
  setSessionSnapshot: (record) => guard(undefined, () => put("session", record)),
  clearSessionSnapshot: () => guard(undefined, () => clearStore("session")),
  getLegacyWorkouts: () => guard<Workout[]>([], () => getAll<Workout>("workouts")),
  putLegacyWorkout: (workout) => guard(undefined, () => put("workouts", workout)),
  clearLegacyWorkouts: () => guard(undefined, () => clearStore("workouts")),
  getMeta: (id) =>
    guard<MetaRecord | null>(null, async () => (await getById<MetaRecord>("meta", id)) ?? null),
  setMeta: (record) => guard(undefined, () => put("meta", record)),
};
