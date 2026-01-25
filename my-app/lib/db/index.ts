import type { Exercise, SetEntry, SettingsState, WorkoutId } from "../types";

const DB_NAME = "gymlog";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable on server"));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("exercises")) {
        db.createObjectStore("exercises", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("sets")) {
        const store = db.createObjectStore("sets", { keyPath: "id" });
        store.createIndex("date", "date", { unique: false });
        store.createIndex("exerciseId", "exerciseId", { unique: false });
        store.createIndex("ts", "ts", { unique: false });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
};

const requestToPromise = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const transactionDone = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

export const getAllExercises = async () => {
  const db = await openDb();
  const tx = db.transaction("exercises", "readonly");
  const store = tx.objectStore("exercises");
  const items = await requestToPromise<Exercise[]>(store.getAll());
  await transactionDone(tx);
  return items.sort((a, b) => a.order - b.order);
};

export const saveExercise = async (exercise: Exercise) => {
  const db = await openDb();
  const tx = db.transaction("exercises", "readwrite");
  tx.objectStore("exercises").put(exercise);
  await transactionDone(tx);
};

export const saveExercises = async (exercises: Exercise[]) => {
  const db = await openDb();
  const tx = db.transaction("exercises", "readwrite");
  const store = tx.objectStore("exercises");
  exercises.forEach((exercise) => store.put(exercise));
  await transactionDone(tx);
};

export const deleteExercise = async (id: string) => {
  const db = await openDb();
  const tx = db.transaction("exercises", "readwrite");
  tx.objectStore("exercises").delete(id);
  await transactionDone(tx);
};

export const reorderExercises = async (
  workout: WorkoutId,
  orderedIds: string[],
) => {
  const exercises = await getAllExercises();
  const updated = exercises.map((exercise) => {
    if (exercise.workout !== workout) return exercise;
    const index = orderedIds.indexOf(exercise.id);
    return {
      ...exercise,
      order: index === -1 ? exercise.order : index,
    };
  });
  await saveExercises(updated);
};

export const addSet = async (entry: SetEntry) => {
  const db = await openDb();
  const tx = db.transaction("sets", "readwrite");
  tx.objectStore("sets").put(entry);
  await transactionDone(tx);
};

export const updateSet = async (entry: SetEntry) => {
  const db = await openDb();
  const tx = db.transaction("sets", "readwrite");
  tx.objectStore("sets").put(entry);
  await transactionDone(tx);
};

export const deleteSet = async (id: string) => {
  const db = await openDb();
  const tx = db.transaction("sets", "readwrite");
  tx.objectStore("sets").delete(id);
  await transactionDone(tx);
};

export const getAllSets = async () => {
  const db = await openDb();
  const tx = db.transaction("sets", "readonly");
  const store = tx.objectStore("sets");
  const items = await requestToPromise<SetEntry[]>(store.getAll());
  await transactionDone(tx);
  return items.sort((a, b) => b.ts - a.ts);
};

export const querySetsByDate = async (date: string) => {
  const db = await openDb();
  const tx = db.transaction("sets", "readonly");
  const store = tx.objectStore("sets");
  const items = await requestToPromise<SetEntry[]>(
    store.index("date").getAll(date),
  );
  await transactionDone(tx);
  return items.sort((a, b) => b.ts - a.ts);
};

export const querySetsByExercise = async (exerciseId: string) => {
  const db = await openDb();
  const tx = db.transaction("sets", "readonly");
  const store = tx.objectStore("sets");
  const items = await requestToPromise<SetEntry[]>(
    store.index("exerciseId").getAll(exerciseId),
  );
  await transactionDone(tx);
  return items.sort((a, b) => b.ts - a.ts);
};

export const getSetting = async <T = unknown>(key: string) => {
  const db = await openDb();
  const tx = db.transaction("settings", "readonly");
  const store = tx.objectStore("settings");
  const item = await requestToPromise<{ key: string; value: T } | undefined>(
    store.get(key),
  );
  await transactionDone(tx);
  return item?.value ?? null;
};

export const getAllSettings = async (): Promise<Partial<SettingsState>> => {
  const db = await openDb();
  const tx = db.transaction("settings", "readonly");
  const store = tx.objectStore("settings");
  const items = await requestToPromise<Array<{ key: string; value: unknown }>>(
    store.getAll(),
  );
  await transactionDone(tx);
  return items.reduce<Partial<SettingsState>>((acc, item) => {
    acc[item.key as keyof SettingsState] = item.value as never;
    return acc;
  }, {});
};

export const setSetting = async <T = unknown>(key: string, value: T) => {
  const db = await openDb();
  const tx = db.transaction("settings", "readwrite");
  tx.objectStore("settings").put({ key, value });
  await transactionDone(tx);
};

export const setSettings = async (settings: Partial<SettingsState>) => {
  const db = await openDb();
  const tx = db.transaction("settings", "readwrite");
  const store = tx.objectStore("settings");
  Object.entries(settings).forEach(([key, value]) => {
    store.put({ key, value });
  });
  await transactionDone(tx);
};

export const clearAllData = async () => {
  const db = await openDb();
  const tx = db.transaction(["exercises", "sets", "settings"], "readwrite");
  tx.objectStore("exercises").clear();
  tx.objectStore("sets").clear();
  tx.objectStore("settings").clear();
  await transactionDone(tx);
};
