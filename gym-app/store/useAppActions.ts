"use client";

import { useMemo } from "react";
import { createAppActions } from "./appActions";
import { useCatalogStoreApi } from "./useCatalogStore";
import { useSessionStoreApi } from "./useSessionStore";
import { useSettingsStoreApi } from "./useSettingsStore";

export const useAppActions = () => {
  const settingsStore = useSettingsStoreApi();
  const catalogStore = useCatalogStoreApi();
  const sessionStore = useSessionStoreApi();

  return useMemo(
    () => createAppActions({ settingsStore, catalogStore, sessionStore }),
    [settingsStore, catalogStore, sessionStore]
  );
};
