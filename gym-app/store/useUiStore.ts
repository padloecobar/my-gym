"use client";

import { useContext } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { UiStoreContext } from "./AppStoreProvider";
import type { UiState } from "./uiStore";

export const useUiStoreApi = () => {
  const store = useContext(UiStoreContext);
  if (!store) throw new Error("AppStoreProvider missing");
  return store;
};

export const useUiStore = <T,>(selector: (state: UiState) => T): T => {
  const store = useUiStoreApi();
  return useStore(store, selector);
};

export const useUiShallow = <T extends object>(selector: (state: UiState) => T): T => {
  return useUiStore(useShallow(selector));
};
