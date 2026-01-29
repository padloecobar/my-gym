"use client";

import { useContext } from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { SessionStoreContext } from "./AppStoreProvider";
import type { SessionState } from "./sessionStore/index";

export const useSessionStoreApi = () => {
  const store = useContext(SessionStoreContext);
  if (!store) throw new Error("AppStoreProvider missing");
  return store;
};

export const useSessionStore = <T,>(selector: (state: SessionState) => T): T => {
  const store = useSessionStoreApi();
  return useStore(store, selector);
};

export const useSessionShallow = <T extends object>(selector: (state: SessionState) => T): T => {
  return useSessionStore(useShallow(selector));
};
