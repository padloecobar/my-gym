import type {
  Exercise,
  SessionEntry,
  SetEntry,
  SettingsState,
  WorkoutId,
} from "../types";
import {
  addSet,
  clearAllData,
  deleteExercise,
  deleteSession,
  deleteSessionWithSets,
  deleteSet,
  getAllExercises,
  getAllSessions,
  getAllSets,
  getAllSettings,
  getMirrorHandle,
  getMirrorLastWrite,
  getSession,
  getSetting,
  listSessions,
  querySetsByDate,
  querySetsByExercise,
  reorderExercises,
  saveExercise,
  saveExercises,
  saveSession,
  saveSessions,
  setMirrorHandle,
  setMirrorLastWrite,
  setSetting,
  setSettings,
  updateSet,
} from "./index";

type ListSessionsOptions = {
  limit: number;
  before?: string;
};

type SessionPage = {
  sessions: SessionEntry[];
  hasMore: boolean;
};

export const dbService = {
  getAllExercises: (): Promise<Exercise[]> => getAllExercises(),
  saveExercise: (exercise: Exercise): Promise<void> => saveExercise(exercise),
  saveExercises: (exercises: Exercise[]): Promise<void> => saveExercises(exercises),
  deleteExercise: (id: string): Promise<void> => deleteExercise(id),
  reorderExercises: (workout: WorkoutId, orderedIds: string[]): Promise<void> =>
    reorderExercises(workout, orderedIds),
  addSet: (entry: SetEntry): Promise<void> => addSet(entry),
  updateSet: (entry: SetEntry): Promise<void> => updateSet(entry),
  deleteSet: (id: string): Promise<void> => deleteSet(id),
  getAllSets: (): Promise<SetEntry[]> => getAllSets(),
  querySetsByDate: (date: string): Promise<SetEntry[]> => querySetsByDate(date),
  querySetsByExercise: (exerciseId: string): Promise<SetEntry[]> =>
    querySetsByExercise(exerciseId),
  getSession: (date: string): Promise<SessionEntry | null> => getSession(date),
  getAllSessions: (): Promise<SessionEntry[]> => getAllSessions(),
  listSessions: (options: ListSessionsOptions): Promise<SessionPage> =>
    listSessions(options),
  saveSession: (session: SessionEntry): Promise<void> => saveSession(session),
  saveSessions: (sessions: SessionEntry[]): Promise<void> => saveSessions(sessions),
  deleteSession: (date: string): Promise<void> => deleteSession(date),
  deleteSessionWithSets: (date: string): Promise<void> =>
    deleteSessionWithSets(date),
  getSetting: <T = unknown>(key: string): Promise<T | null> => getSetting<T>(key),
  getAllSettings: (): Promise<Partial<SettingsState>> => getAllSettings(),
  setSetting: <T = unknown>(key: string, value: T): Promise<void> =>
    setSetting(key, value),
  setSettings: (settings: Partial<SettingsState>): Promise<void> =>
    setSettings(settings),
  getMirrorHandle: (): Promise<FileSystemFileHandle | null> => getMirrorHandle(),
  setMirrorHandle: (handle: FileSystemFileHandle | null): Promise<void> =>
    setMirrorHandle(handle),
  getMirrorLastWrite: (): Promise<number | null> => getMirrorLastWrite(),
  setMirrorLastWrite: (lastWrite: number | null): Promise<void> =>
    setMirrorLastWrite(lastWrite),
  clearAllData: (): Promise<void> => clearAllData(),
};

export type { ListSessionsOptions, SessionPage };
