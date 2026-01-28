"use client";

import { useContext } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { SettingsStoreContext } from "./AppStoreProvider";
import type { SettingsState } from "./settingsStore";

export const useSettingsStoreApi = () => {
  const store = useContext(SettingsStoreContext);
  if (!store) throw new Error("AppStoreProvider missing");
  return store;
};

export const useSettingsStore = <T,>(selector: (state: SettingsState) => T): T => {
  const store = useSettingsStoreApi();
  return useStore(store, selector);
};

export const useSettingsShallow = <T extends object>(selector: (state: SettingsState) => T): T => {
  return useSettingsStore(useShallow(selector));
};
