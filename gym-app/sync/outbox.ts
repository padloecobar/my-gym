import { createStore } from "zustand/vanilla";
import { createId } from "../app/shared/lib/utils";
import type { StorageAdapter } from "../storage/adapter";
import { createDebounced } from "../app/shared/lib/debounce";

export const OUTBOX_SCHEMA_VERSION = 1;
const OUTBOX_STORAGE_KEY = "outbox";

export type SyncEvent = {
  id: string;
  type:
    | "WORKOUT_STARTED"
    | "WORKOUT_FINISHED"
    | "SET_UPDATED"
    | "SET_ADDED"
    | "SET_DELETED"
    | "SET_RESTORED";
  payload: Record<string, unknown>;
  createdAt: number;
};

type OutboxState = {
  pendingEvents: SyncEvent[];
  hasHydrated: boolean;
  enqueue: (event: Omit<SyncEvent, "id" | "createdAt">) => SyncEvent;
  markSynced: (eventId: string) => void;
  clear: () => void;
};

const outboxStore = createStore<OutboxState>((set) => ({
  pendingEvents: [],
  hasHydrated: false,
  enqueue: (event) => {
    const next: SyncEvent = {
      ...event,
      id: createId(),
      createdAt: Date.now(),
    };
    set((state) => ({ pendingEvents: [...state.pendingEvents, next] }), false);
    return next;
  },
  markSynced: (eventId) =>
    set((state) => ({ pendingEvents: state.pendingEvents.filter((event) => event.id !== eventId) }), false),
  clear: () => set({ pendingEvents: [] }, false),
}));

export const enqueueSyncEvent = (event: Omit<SyncEvent, "id" | "createdAt">) => {
  outboxStore.getState().enqueue(event);
};

type OutboxRecord = {
  schemaVersion: number;
  value: SyncEvent[];
  updatedAt?: number;
};

const migrateOutbox = (events: SyncEvent[], fromVersion: number) => {
  if (fromVersion === OUTBOX_SCHEMA_VERSION) return events;
  return events;
};

const mergeEvents = (stored: SyncEvent[], current: SyncEvent[]) => {
  const existing = new Set(stored.map((event) => event.id));
  const merged = [...stored, ...current.filter((event) => !existing.has(event.id))];
  merged.sort((a, b) => a.createdAt - b.createdAt);
  return merged;
};

const persistOutbox = async (storage: StorageAdapter, events: SyncEvent[]) => {
  if (events.length === 0) {
    await storage.removeItem(OUTBOX_STORAGE_KEY);
    return;
  }
  await storage.setItem(OUTBOX_STORAGE_KEY, {
    schemaVersion: OUTBOX_SCHEMA_VERSION,
    value: events,
    updatedAt: Date.now(),
  } satisfies OutboxRecord);
};

export const hydrateOutbox = async (storage: StorageAdapter) => {
  const record = await storage.getItem<OutboxRecord>(OUTBOX_STORAGE_KEY);
  const storedVersion = record?.schemaVersion ?? 0;
  const storedEvents = migrateOutbox(record?.value ?? [], storedVersion);
  const currentEvents = outboxStore.getState().pendingEvents;
  const merged = mergeEvents(storedEvents, currentEvents);

  outboxStore.setState(
    {
      pendingEvents: merged,
      hasHydrated: true,
    },
    false
  );

  if (!record || storedVersion !== OUTBOX_SCHEMA_VERSION) {
    void persistOutbox(storage, merged).catch(() => undefined);
  }
};

export const attachOutboxPersistence = (storage: StorageAdapter) => {
  const debounce = createDebounced(200);

  const unsubscribe = outboxStore.subscribe((state, prev) => {
    if (!state.hasHydrated) return;
    if (state.pendingEvents === prev.pendingEvents && state.hasHydrated === prev.hasHydrated) {
      return;
    }
    debounce.schedule(() => {
      void persistOutbox(storage, outboxStore.getState().pendingEvents).catch(() => undefined);
    });
  });

  return () => {
    unsubscribe();
    debounce.cancel();
  };
};

export { outboxStore };
