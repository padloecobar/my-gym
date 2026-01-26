import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { useDbChange } from "./useDbChange";
import { dbService, type ListSessionsOptions, type SessionPage } from "../../lib/db/service";

import type { SessionEntry } from "../../lib/types";

const SESSION_SOURCES = new Set([
  "saveSession",
  "saveSessions",
  "deleteSession",
  "deleteSessionWithSets",
  "addSet",
  "deleteSet",
  "clearAllData",
]);

type UseSessionsOptions = {
  autoLoad?: boolean;
};

type UseSessionsState = {
  sessions: SessionEntry[];
  loading: boolean;
  error: string | null;
};

type UseSessionsActions = {
  refresh: () => Promise<void>;
  listSessions: (options: ListSessionsOptions) => Promise<SessionPage>;
  getSession: (date: string) => Promise<SessionEntry | null>;
  saveSession: (session: SessionEntry) => Promise<void>;
  saveSessions: (sessions: SessionEntry[]) => Promise<void>;
  deleteSession: (date: string) => Promise<void>;
  deleteSessionWithSets: (date: string) => Promise<void>;
  setSessions: Dispatch<SetStateAction<SessionEntry[]>>;
};

export const useSessions = (
  options: UseSessionsOptions = {},
): UseSessionsState & UseSessionsActions => {
  const { autoLoad = true } = options;
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dbService.getAllSessions();
      setSessions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoLoad) return;
    void refresh();
  }, [autoLoad, refresh]);

  useDbChange(
    useCallback(
      (detail) => {
        if (!autoLoad) return;
        if (!SESSION_SOURCES.has(detail.source)) return;
        void refresh();
      },
      [autoLoad, refresh],
    ),
  );

  return {
    sessions,
    loading,
    error,
    refresh,
    listSessions: (options) => dbService.listSessions(options),
    getSession: (date) => dbService.getSession(date),
    saveSession: (session) => dbService.saveSession(session),
    saveSessions: (items) => dbService.saveSessions(items),
    deleteSession: (date) => dbService.deleteSession(date),
    deleteSessionWithSets: (date) => dbService.deleteSessionWithSets(date),
    setSessions,
  };
};
