"use client";

import { createContext, useEffect, useRef, type ReactNode } from "react";
import { createCatalogStore } from "./catalogStore";
import { createSessionStore } from "./sessionStore";
import { createSettingsStore } from "./settingsStore";
import { createUiStore } from "./uiStore";
import { defaultSettings } from "../lib/seed";
import { indexedDbStorage } from "../storage/adapter";
import { attachStoreSubscriptions } from "./storeSubscriptions";
import { attachOutboxPersistence, hydrateOutbox } from "../sync/outbox";

export type SettingsStore = ReturnType<typeof createSettingsStore>;
export type CatalogStore = ReturnType<typeof createCatalogStore>;
export type SessionStore = ReturnType<typeof createSessionStore>;
export type UiStore = ReturnType<typeof createUiStore>;

export const SettingsStoreContext = createContext<SettingsStore | null>(null);
export const CatalogStoreContext = createContext<CatalogStore | null>(null);
export const SessionStoreContext = createContext<SessionStore | null>(null);
export const UiStoreContext = createContext<UiStore | null>(null);

export default function AppStoreProvider({ children }: { children: ReactNode }) {
  const settingsRef = useRef<SettingsStore | null>(null);
  const catalogRef = useRef<CatalogStore | null>(null);
  const sessionRef = useRef<SessionStore | null>(null);
  const uiRef = useRef<UiStore | null>(null);

  if (!settingsRef.current) {
    settingsRef.current = createSettingsStore(indexedDbStorage);
  }
  if (!catalogRef.current) {
    catalogRef.current = createCatalogStore(indexedDbStorage);
  }
  if (!sessionRef.current) {
    sessionRef.current = createSessionStore({
      storage: indexedDbStorage,
      getSettings: () => settingsRef.current?.getState().settings ?? defaultSettings,
      getCatalog: () => ({
        programs: catalogRef.current?.getState().programs ?? [],
        exercises: catalogRef.current?.getState().exercises ?? [],
      }),
    });
  }
  if (!uiRef.current) {
    uiRef.current = createUiStore();
  }

  const settingsStore = settingsRef.current;
  const catalogStore = catalogRef.current;
  const sessionStore = sessionRef.current;

  useEffect(() => {
    if (!settingsStore || !catalogStore || !sessionStore) return;

    const unsubscribe = attachStoreSubscriptions({
      settingsStore,
      catalogStore,
      sessionStore,
      storage: indexedDbStorage,
    });
    const unsubscribeOutbox = attachOutboxPersistence(indexedDbStorage);

    void hydrateOutbox(indexedDbStorage);
    void settingsStore.getState().hydrate();
    void catalogStore.getState().hydrate();
    void sessionStore.getState().hydrate();

    return () => {
      unsubscribe();
      unsubscribeOutbox();
    };
  }, [settingsStore, catalogStore, sessionStore]);

  return (
    <SettingsStoreContext.Provider value={settingsRef.current}>
      <CatalogStoreContext.Provider value={catalogRef.current}>
        <SessionStoreContext.Provider value={sessionRef.current}>
          <UiStoreContext.Provider value={uiRef.current}>{children}</UiStoreContext.Provider>
        </SessionStoreContext.Provider>
      </CatalogStoreContext.Provider>
    </SettingsStoreContext.Provider>
  );
}
