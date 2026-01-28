import { createStore } from "zustand/vanilla";
import type { Settings } from "../types/gym";
import { defaultSettings } from "../lib/seed";
import type { StorageAdapter } from "../storage/adapter";
import { indexedDbStorage } from "../storage/adapter";

export const SETTINGS_SCHEMA_VERSION = 1;

export type SettingsState = {
  schemaVersion: number;
  hasHydrated: boolean;
  lastHydratedAt?: number;
  settings: Settings;
  hydrate: () => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => void;
  replaceSettings: (settings: Settings) => void;
};

const migrateSettings = (value: Settings, fromVersion: number): Settings => {
  if (fromVersion === SETTINGS_SCHEMA_VERSION) return value;
  return value;
};

export const createSettingsStore = (storage: StorageAdapter = indexedDbStorage) =>
  createStore<SettingsState>((set, get) => ({
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    hasHydrated: false,
    settings: defaultSettings,
    lastHydratedAt: undefined,
    hydrate: async () => {
      if (get().hasHydrated) return;
      const record = await storage.getSettings();
      const storedVersion = record?.schemaVersion ?? 0;
      const storedSettings = record?.value ?? defaultSettings;
      const migrated = migrateSettings(storedSettings, storedVersion);
      set(
        {
          settings: migrated,
          hasHydrated: true,
          lastHydratedAt: Date.now(),
        },
        false
      );
    },
    updateSettings: (patch) => {
      set(
        (state) => {
          const nextSettings = { ...state.settings, ...patch };
          return { settings: nextSettings };
        },
        false
      );
    },
    replaceSettings: (settings) => {
      set({ settings }, false);
    },
  }));
