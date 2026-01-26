import { useCallback, useEffect, useState } from "react";

import { useDbChange } from "./useDbChange";
import { dbService } from "../../lib/db/service";
import { defaultSettings } from "../../lib/defaults";

import type { SettingsState } from "../../lib/types";

const SETTINGS_SOURCES = new Set([
  "setSetting",
  "setSettings",
  "clearAllData",
]);

type UseSettingsState = {
  settings: SettingsState;
  loading: boolean;
  error: string | null;
};

type UseSettingsActions = {
  refresh: () => Promise<void>;
  updateSettings: (updates: Partial<SettingsState>) => Promise<void>;
  replaceSettings: (next: SettingsState) => Promise<void>;
};

const mergeDefaults = (partial: Partial<SettingsState>): SettingsState =>
  ({ ...defaultSettings, ...partial } as SettingsState);

export const useSettings = (): UseSettingsState & UseSettingsActions => {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dbService.getAllSettings();
      setSettings(mergeDefaults(data));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useDbChange(
    useCallback(
      (detail) => {
        if (!SETTINGS_SOURCES.has(detail.source)) return;
        void refresh();
      },
      [refresh],
    ),
  );

  const updateSettings = useCallback(async (updates: Partial<SettingsState>) => {
    const next = { ...settings, ...updates } as SettingsState;
    setSettings(next);
    await dbService.setSettings(updates);
  }, [settings]);

  const replaceSettings = useCallback(async (next: SettingsState) => {
    setSettings(next);
    await dbService.setSettings(next);
  }, []);

  return { settings, loading, error, refresh, updateSettings, replaceSettings };
};
