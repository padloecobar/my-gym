import type { GymExport } from "../types/gym";

const DB_NAME = "gym-tracker";
const DB_VERSION = 1;

type StoreName = "programs" | "exercises" | "workouts" | "settings";

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = () => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB is not available on the server."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("programs")) {
        db.createObjectStore("programs", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("exercises")) {
        db.createObjectStore("exercises", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("workouts")) {
        db.createObjectStore("workouts", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
  return dbPromise;
};

const withStore = async <T>(storeName: StoreName, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) => {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = action(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAll = async <T>(storeName: StoreName): Promise<T[]> => {
  return withStore(storeName, "readonly", (store) => store.getAll());
};

export const getById = async <T>(storeName: StoreName, id: string): Promise<T | undefined> => {
  return withStore(storeName, "readonly", (store) => store.get(id));
};

export const put = async <T extends { id: string }>(storeName: StoreName, value: T): Promise<void> => {
  await withStore(storeName, "readwrite", (store) => store.put(value));
};

export const deleteById = async (storeName: StoreName, id: string): Promise<void> => {
  await withStore(storeName, "readwrite", (store) => store.delete(id));
};

export const clearStore = async (storeName: StoreName): Promise<void> => {
  await withStore(storeName, "readwrite", (store) => store.clear());
};

export const exportJSON = async (): Promise<GymExport> => {
  const [programs, exercises, workouts] = await Promise.all([
    getAll<GymExport["programs"][number]>("programs"),
    getAll<GymExport["exercises"][number]>("exercises"),
    getAll<GymExport["workouts"][number]>("workouts"),
  ]);

  const settingsRecord = await getById<{ id: string; value: GymExport["settings"] }>("settings", "settings");

  return {
    programs,
    exercises,
    workouts,
    settings: settingsRecord?.value ?? {
      unitsPreference: "kg",
      defaultBarWeight: 20,
    },
  };
};

export const importJSON = async (payload: GymExport): Promise<void> => {
  await Promise.all([
    clearStore("programs"),
    clearStore("exercises"),
    clearStore("workouts"),
    clearStore("settings"),
  ]);

  await Promise.all([
    ...payload.programs.map((program) => put("programs", program)),
    ...payload.exercises.map((exercise) => put("exercises", exercise)),
    ...payload.workouts.map((workout) => put("workouts", workout)),
    put("settings", { id: "settings", value: payload.settings }),
  ]);
};

export const saveSettings = async (settings: GymExport["settings"]) => {
  await put("settings", { id: "settings", value: settings });
};
