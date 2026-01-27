import { deleteById, put, saveSettings } from "./db";

type StoreName = "programs" | "exercises" | "workouts" | "settings";

type QueueEntry = {
  timeout: number;
  action: () => void;
};

const queue = new Map<string, QueueEntry>();
const DEBOUNCE_MS = 180;

const schedule = (key: string, action: () => void) => {
  const existing = queue.get(key);
  if (existing) {
    clearTimeout(existing.timeout);
  }
  const timeout = window.setTimeout(() => {
    queue.delete(key);
    action();
  }, DEBOUNCE_MS);
  queue.set(key, { timeout, action });
};

export const schedulePut = <T extends { id: string }>(store: StoreName, value: T) => {
  if (typeof window === "undefined") return;
  schedule(`${store}:${value.id}`, () => {
    put(store, value).catch(() => undefined);
  });
};

export const scheduleDelete = (store: StoreName, id: string) => {
  if (typeof window === "undefined") return;
  schedule(`${store}:delete:${id}`, () => {
    deleteById(store, id).catch(() => undefined);
  });
};

export const scheduleSettings = (settings: { unitsPreference: "kg" | "lb"; defaultBarWeight: number }) => {
  if (typeof window === "undefined") return;
  schedule("settings", () => {
    saveSettings(settings).catch(() => undefined);
  });
};
