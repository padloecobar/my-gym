"use client";

import { useContext } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { CatalogStoreContext } from "./AppStoreProvider";
import type { CatalogState } from "./catalogStore";

export const useCatalogStoreApi = () => {
  const store = useContext(CatalogStoreContext);
  if (!store) throw new Error("AppStoreProvider missing");
  return store;
};

export const useCatalogStore = <T,>(selector: (state: CatalogState) => T): T => {
  const store = useCatalogStoreApi();
  return useStore(store, selector);
};

export const useCatalogShallow = <T extends object>(selector: (state: CatalogState) => T): T => {
  return useCatalogStore(useShallow(selector));
};
