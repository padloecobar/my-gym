"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Command } from "./types";
import { executeCommand } from "./execute";
import { useCatalogStoreApi } from "../store/useCatalogStore";
import { useSessionStoreApi } from "../store/useSessionStore";
import { useSettingsStoreApi } from "../store/useSettingsStore";
import { useUiStoreApi } from "../store/useUiStore";

export const useCommandExecutor = () => {
  const router = useRouter();
  const settingsStore = useSettingsStoreApi();
  const catalogStore = useCatalogStoreApi();
  const sessionStore = useSessionStoreApi();
  const uiStore = useUiStoreApi();

  return useCallback(
    (command: Command) => executeCommand(command, { settingsStore, catalogStore, sessionStore, uiStore, router }),
    [settingsStore, catalogStore, sessionStore, uiStore, router]
  );
};
