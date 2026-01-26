import type {
  Exercise,
  SessionEntry,
  SetEntry,
  SettingsState,
  WorkoutId,
} from "../types";

const DB_NAME = "gymlog";
const DB_VERSION = 3;

let dbPromise: Promise<IDBDatabase> | null = null;

const openDbRequest = (version?: number) =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request =
      typeof version === "number"
        ? indexedDB.open(DB_NAME, version)
        : indexedDB.open(DB_NAME);
    request.onupgradeneeded = () => {
      const db = request.result;
      const tx = request.transaction ?? null;
      if (!db.objectStoreNames.contains("exercises")) {
        db.createObjectStore("exercises", { keyPath: "id" });
      }

      let setStore: IDBObjectStore | null = null;
      if (!db.objectStoreNames.contains("sets")) {
        setStore = db.createObjectStore("sets", { keyPath: "id" });
      } else if (tx) {
        setStore = tx.objectStore("sets");
      }
      if (setStore) {
        if (!setStore.indexNames.contains("date")) {
          setStore.createIndex("date", "date", { unique: false });
        }
        if (!setStore.indexNames.contains("exerciseId")) {
          setStore.createIndex("exerciseId", "exerciseId", { unique: false });
        }
        if (!setStore.indexNames.contains("ts")) {
          setStore.createIndex("ts", "ts", { unique: false });
        }
        if (!setStore.indexNames.contains("date_ts")) {
          setStore.createIndex("date_ts", ["date", "ts"], { unique: false });
        }
        if (!setStore.indexNames.contains("exerciseId_date")) {
          setStore.createIndex("exerciseId_date", ["exerciseId", "date"], {
            unique: false,
          });
        }
      }

      const hadSessions = db.objectStoreNames.contains("sessions");
      if (!hadSessions) {
        db.createObjectStore("sessions", { keyPath: "date" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("mirror")) {
        db.createObjectStore("mirror", { keyPath: "key" });
      }

      if (!hadSessions && tx && setStore && db.objectStoreNames.contains("exercises")) {
        const exercisesStore = tx.objectStore("exercises");
        const sessionsStore = tx.objectStore("sessions");
        const exercisesRequest = exercisesStore.getAll();
        exercisesRequest.onsuccess = () => {
          const exercises = exercisesRequest.result as Exercise[];
          const workoutByExercise = new Map(
            exercises.map((exercise) => [exercise.id, exercise.workout]),
          );
          const setsRequest = setStore.getAll();
          setsRequest.onsuccess = () => {
            const sets = (setsRequest.result as SetEntry[]).sort(
              (a, b) => a.ts - b.ts,
            );
            const byDate = new Map<string, SessionEntry>();
            sets.forEach((setEntry) => {
              const workoutId = workoutByExercise.get(setEntry.exerciseId);
              const existing = byDate.get(setEntry.date);
              if (!existing) {
                byDate.set(setEntry.date, {
                  date: setEntry.date,
                  workoutId,
                  createdAtTs: setEntry.ts,
                  updatedAtTs: setEntry.ts,
                  exercisesSnapshot: [setEntry.exerciseId],
                });
                return;
              }
              const nextWorkout =
                existing.workoutId &&
                workoutId &&
                existing.workoutId !== workoutId
                  ? "Custom"
                  : existing.workoutId ?? workoutId;
              const snapshot = existing.exercisesSnapshot ?? [];
              if (!snapshot.includes(setEntry.exerciseId)) {
                snapshot.push(setEntry.exerciseId);
              }
              byDate.set(setEntry.date, {
                ...existing,
                workoutId: nextWorkout,
                updatedAtTs: Math.max(existing.updatedAtTs, setEntry.ts),
                createdAtTs: Math.min(existing.createdAtTs, setEntry.ts),
                exercisesSnapshot: snapshot,
              });
            });
            byDate.forEach((session) => {
              sessionsStore.put(session);
            });
          };
        };
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB open failed"));
  });

const openDb = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable on server"));
  }
  if (dbPromise) return dbPromise;
  dbPromise = openDbRequest(DB_VERSION).catch((error) => {
    if (error instanceof DOMException && error.name === "VersionError") {
      return openDbRequest();
    }
    throw error;
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
};

const requestToPromise = <T>(request: IDBRequest<unknown>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed"));
  });

const transactionDone = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () =>
      reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });

export const DB_CHANGE_EVENT = "gymlog:db-change";

const notifyDbChange = (source: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(DB_CHANGE_EVENT, {
      detail: { source, ts: Date.now() },
    }),
  );
};

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
  notifyDbChange("saveExercise");
};

export const saveExercises = async (exercises: Exercise[]) => {
  const db = await openDb();
  const tx = db.transaction("exercises", "readwrite");
  const store = tx.objectStore("exercises");
  exercises.forEach((exercise) => store.put(exercise));
  await transactionDone(tx);
  notifyDbChange("saveExercises");
};

export const deleteExercise = async (id: string) => {
  const db = await openDb();
  const tx = db.transaction("exercises", "readwrite");
  tx.objectStore("exercises").delete(id);
  await transactionDone(tx);
  notifyDbChange("deleteExercise");
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
  const storeNames: Array<"sets" | "sessions" | "exercises"> = ["sets"];
  const hasSessions = db.objectStoreNames.contains("sessions");
  const hasExercises = db.objectStoreNames.contains("exercises");
  if (hasSessions) storeNames.push("sessions");
  if (hasExercises) storeNames.push("exercises");
  const tx = db.transaction(storeNames, "readwrite");
  const setStore = tx.objectStore("sets");
  setStore.put(entry);

  if (hasSessions && hasExercises) {
    const exercisesStore = tx.objectStore("exercises");
    const sessionsStore = tx.objectStore("sessions");
    const exercise = await requestToPromise<Exercise | undefined>(
      exercisesStore.get(entry.exerciseId),
    );
    const existing = await requestToPromise<SessionEntry | undefined>(
      sessionsStore.get(entry.date),
    );
    const workoutId = exercise?.workout;
    const snapshot = existing?.exercisesSnapshot ? [...existing.exercisesSnapshot] : [];
    if (!snapshot.includes(entry.exerciseId)) {
      snapshot.push(entry.exerciseId);
    }
    const resolvedWorkout =
      existing?.workoutId === "Custom"
        ? "Custom"
        : existing?.workoutId && workoutId && existing.workoutId !== workoutId
          ? "Custom"
          : existing?.workoutId ?? workoutId;
    const now = Date.now();
    sessionsStore.put({
      date: entry.date,
      workoutId: resolvedWorkout,
      createdAtTs: existing?.createdAtTs ?? entry.ts,
      updatedAtTs: Math.max(existing?.updatedAtTs ?? 0, now),
      notes: existing?.notes,
      exercisesSnapshot: snapshot.length ? snapshot : undefined,
    });
  }

  await transactionDone(tx);
  notifyDbChange("addSet");
};

export const updateSet = async (entry: SetEntry) => {
  const db = await openDb();
  const tx = db.transaction("sets", "readwrite");
  tx.objectStore("sets").put(entry);
  await transactionDone(tx);
  notifyDbChange("updateSet");
};

export const deleteSet = async (id: string) => {
  const db = await openDb();
  const storeNames: Array<"sets" | "sessions"> = ["sets"];
  const hasSessions = db.objectStoreNames.contains("sessions");
  if (hasSessions) storeNames.push("sessions");
  const tx = db.transaction(storeNames, "readwrite");
  const setStore = tx.objectStore("sets");
  const existing = await requestToPromise<SetEntry | undefined>(setStore.get(id));
  if (!existing) {
    await transactionDone(tx);
    return;
  }
  setStore.delete(id);
  if (hasSessions) {
    const sessionsStore = tx.objectStore("sessions");
    const remaining = await requestToPromise<number>(
      setStore.index("date").count(existing.date),
    );
    if (remaining === 0) {
      sessionsStore.delete(existing.date);
    }
  }
  await transactionDone(tx);
  notifyDbChange("deleteSet");
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

export const getSession = async (date: string) => {
  const db = await openDb();
  if (!db.objectStoreNames.contains("sessions")) return null;
  const tx = db.transaction("sessions", "readonly");
  const store = tx.objectStore("sessions");
  const item = await requestToPromise<SessionEntry | undefined>(store.get(date));
  await transactionDone(tx);
  return item ?? null;
};

export const getAllSessions = async () => {
  const db = await openDb();
  if (!db.objectStoreNames.contains("sessions")) return [] as SessionEntry[];
  const tx = db.transaction("sessions", "readonly");
  const store = tx.objectStore("sessions");
  const items = await requestToPromise<SessionEntry[]>(store.getAll());
  await transactionDone(tx);
  return items.sort((a, b) => (a.date < b.date ? 1 : -1));
};

export const saveSession = async (session: SessionEntry) => {
  const db = await openDb();
  if (!db.objectStoreNames.contains("sessions")) return;
  const tx = db.transaction("sessions", "readwrite");
  tx.objectStore("sessions").put(session);
  await transactionDone(tx);
  notifyDbChange("saveSession");
};

export const saveSessions = async (sessions: SessionEntry[]) => {
  const db = await openDb();
  if (!db.objectStoreNames.contains("sessions")) return;
  const tx = db.transaction("sessions", "readwrite");
  const store = tx.objectStore("sessions");
  sessions.forEach((session) => store.put(session));
  await transactionDone(tx);
  notifyDbChange("saveSessions");
};

export const deleteSession = async (date: string) => {
  const db = await openDb();
  if (!db.objectStoreNames.contains("sessions")) return;
  const tx = db.transaction("sessions", "readwrite");
  tx.objectStore("sessions").delete(date);
  await transactionDone(tx);
  notifyDbChange("deleteSession");
};

export const listSessions = async (options: {
  limit: number;
  before?: string;
}) => {
  const db = await openDb();
  if (!db.objectStoreNames.contains("sessions")) {
    return { sessions: [] as SessionEntry[], hasMore: false };
  }
  const tx = db.transaction("sessions", "readonly");
  const store = tx.objectStore("sessions");
  const done = transactionDone(tx);
  const sessions: SessionEntry[] = [];
  const range = options.before
    ? IDBKeyRange.upperBound(options.before, true)
    : undefined;
  const result = await new Promise<{ sessions: SessionEntry[]; hasMore: boolean }>(
    (resolve, reject) => {
      const request = store.openCursor(range, "prev");
      request.onerror = () =>
        reject(request.error ?? new Error("IndexedDB cursor failed"));
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve({ sessions, hasMore: false });
          return;
        }
        sessions.push(cursor.value as SessionEntry);
        if (sessions.length > options.limit) {
          resolve({ sessions: sessions.slice(0, options.limit), hasMore: true });
          return;
        }
        cursor.continue();
      };
    },
  );
  await done;
  return result;
};

export const deleteSessionWithSets = async (date: string) => {
  const db = await openDb();
  const storeNames: Array<"sets" | "sessions"> = ["sets"];
  if (db.objectStoreNames.contains("sessions")) {
    storeNames.push("sessions");
  }
  const tx = db.transaction(storeNames, "readwrite");
  const setStore = tx.objectStore("sets");
  const dateIndex = setStore.index("date");
  const request = dateIndex.openCursor(IDBKeyRange.only(date));
  request.onsuccess = () => {
    const cursor = request.result;
    if (!cursor) return;
    cursor.delete();
    cursor.continue();
  };
  if (db.objectStoreNames.contains("sessions")) {
    tx.objectStore("sessions").delete(date);
  }
  await transactionDone(tx);
  notifyDbChange("deleteSessionWithSets");
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
  notifyDbChange("setSetting");
};

export const setSettings = async (settings: Partial<SettingsState>) => {
  const db = await openDb();
  const tx = db.transaction("settings", "readwrite");
  const store = tx.objectStore("settings");
  Object.entries(settings).forEach(([key, value]) => {
    store.put({ key, value });
  });
  await transactionDone(tx);
  notifyDbChange("setSettings");
};

export const getMirrorHandle = async (): Promise<FileSystemFileHandle | null> => {
  const db = await openDb();
  const tx = db.transaction("mirror", "readonly");
  const store = tx.objectStore("mirror");
  const item = await requestToPromise<{ key: string; value: FileSystemFileHandle } | undefined>(
    store.get("handle"),
  );
  await transactionDone(tx);
  return item?.value ?? null;
};

export const setMirrorHandle = async (handle: FileSystemFileHandle | null) => {
  const db = await openDb();
  const tx = db.transaction("mirror", "readwrite");
  const store = tx.objectStore("mirror");
  if (handle) {
    store.put({ key: "handle", value: handle });
  } else {
    store.delete("handle");
  }
  await transactionDone(tx);
};

export const getMirrorLastWrite = async (): Promise<number | null> => {
  const db = await openDb();
  const tx = db.transaction("mirror", "readonly");
  const store = tx.objectStore("mirror");
  const item = await requestToPromise<{ key: string; value: number } | undefined>(
    store.get("lastWrite"),
  );
  await transactionDone(tx);
  return item?.value ?? null;
};

export const setMirrorLastWrite = async (lastWrite: number | null) => {
  const db = await openDb();
  const tx = db.transaction("mirror", "readwrite");
  const store = tx.objectStore("mirror");
  if (lastWrite !== null) {
    store.put({ key: "lastWrite", value: lastWrite });
  } else {
    store.delete("lastWrite");
  }
  await transactionDone(tx);
};

export const clearAllData = async () => {
  const db = await openDb();
  const tx = db.transaction(
    ["exercises", "sets", "sessions", "settings", "mirror"],
    "readwrite",
  );
  tx.objectStore("exercises").clear();
  tx.objectStore("sets").clear();
  tx.objectStore("sessions").clear();
  tx.objectStore("settings").clear();
  tx.objectStore("mirror").clear();
  await transactionDone(tx);
  notifyDbChange("clearAllData");
};
