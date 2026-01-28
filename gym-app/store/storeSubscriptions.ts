import type { CatalogStore, SessionStore, SettingsStore } from "./AppStoreProvider";
import type { StorageAdapter } from "../storage/adapter";
import { CATALOG_SCHEMA_VERSION } from "./catalogStore";
import { selectSessionSnapshot, SESSION_SCHEMA_VERSION, type SessionState } from "./sessionStore";
import { SETTINGS_SCHEMA_VERSION } from "./settingsStore";
import { enqueueSyncEvent } from "../sync/outbox";

type StoreSubscriptionsDeps = {
  settingsStore: SettingsStore;
  catalogStore: CatalogStore;
  sessionStore: SessionStore;
  storage: StorageAdapter;
};

const createDebounced = (delayMs: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const schedule = (action: () => void) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      action();
    }, delayMs);
  };

  const cancel = () => {
    if (!timeout) return;
    clearTimeout(timeout);
    timeout = null;
  };

  return { schedule, cancel };
};

const didSessionEntityChange = (next: SessionState, prev: SessionState) =>
  next.activeWorkoutId !== prev.activeWorkoutId ||
  next.workoutsById !== prev.workoutsById ||
  next.entriesById !== prev.entriesById ||
  next.setsById !== prev.setsById ||
  next.entryIdsByWorkoutId !== prev.entryIdsByWorkoutId ||
  next.setIdsByEntryId !== prev.setIdsByEntryId ||
  next.workoutIds !== prev.workoutIds;

export const attachStoreSubscriptions = ({
  settingsStore,
  catalogStore,
  sessionStore,
  storage,
}: StoreSubscriptionsDeps) => {
  const settingsDebounce = createDebounced(200);
  const catalogDebounce = createDebounced(240);
  const sessionDebounce = createDebounced(180);

  const persistSettings = () => {
    const state = settingsStore.getState();
    if (!state.hasHydrated) return;
    void storage
      .setSettings({
        id: "settings",
        schemaVersion: SETTINGS_SCHEMA_VERSION,
        value: state.settings,
        updatedAt: Date.now(),
      })
      .catch(() => undefined);
  };

  const persistCatalog = () => {
    const state = catalogStore.getState();
    if (!state.hasHydrated) return;
    void (async () => {
      await Promise.all([storage.clearPrograms(), storage.clearExercises()]);
      await Promise.all([
        ...state.exercises.map((exercise) => storage.putExercise(exercise)),
        ...state.programs.map((program) => storage.putProgram(program)),
      ]);
      await storage.setMeta({
        id: "catalog",
        value: { schemaVersion: CATALOG_SCHEMA_VERSION, updatedAt: Date.now() },
      });
    })().catch(() => undefined);
  };

  const persistSession = () => {
    const state = sessionStore.getState();
    if (!state.hasHydrated) return;
    void storage
      .setSessionSnapshot({
        id: "session",
        schemaVersion: SESSION_SCHEMA_VERSION,
        value: selectSessionSnapshot(state),
        updatedAt: Date.now(),
      })
      .catch(() => undefined);
  };

  const unsubscribeSettings = settingsStore.subscribe((state, prev) => {
    if (!state.hasHydrated) return;
    if (state.settings === prev.settings && state.hasHydrated === prev.hasHydrated) return;
    settingsDebounce.schedule(persistSettings);
  });

  const unsubscribeCatalog = catalogStore.subscribe((state, prev) => {
    if (!state.hasHydrated) return;
    if (
      state.programs === prev.programs &&
      state.exercises === prev.exercises &&
      state.hasHydrated === prev.hasHydrated
    ) {
      return;
    }
    catalogDebounce.schedule(persistCatalog);
  });

  const unsubscribeSession = sessionStore.subscribe((state, prev) => {
    if (state.pendingSyncEvent !== prev.pendingSyncEvent && state.pendingSyncEvent) {
      enqueueSyncEvent(state.pendingSyncEvent.event);
    }

    if (state.legacyClearToken !== prev.legacyClearToken && state.legacyClearToken > 0) {
      void storage.clearLegacyWorkouts().catch(() => undefined);
    }

    if (!state.hasHydrated) return;
    if (!didSessionEntityChange(state, prev) && state.hasHydrated === prev.hasHydrated) return;
    sessionDebounce.schedule(persistSession);
  });

  return () => {
    unsubscribeSettings();
    unsubscribeCatalog();
    unsubscribeSession();
    settingsDebounce.cancel();
    catalogDebounce.cancel();
    sessionDebounce.cancel();
  };
};
