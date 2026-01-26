import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { dbService } from "../../lib/db/service";
import type { SetEntry } from "../../lib/types";
import { useDbChange } from "./useDbChange";

const SET_SOURCES = new Set([
  "addSet",
  "updateSet",
  "deleteSet",
  "deleteSessionWithSets",
  "clearAllData",
]);

type UseSetsOptions = {
  autoLoad?: boolean;
};

type UseSetsState = {
  sets: SetEntry[];
  loading: boolean;
  error: string | null;
};

type UseSetsActions = {
  refresh: () => Promise<void>;
  addSet: (entry: SetEntry) => Promise<void>;
  updateSet: (entry: SetEntry) => Promise<void>;
  deleteSet: (id: string) => Promise<void>;
  querySetsByDate: (date: string) => Promise<SetEntry[]>;
  querySetsByExercise: (exerciseId: string) => Promise<SetEntry[]>;
  setSets: Dispatch<SetStateAction<SetEntry[]>>;
};

export const useSets = (
  options: UseSetsOptions = {},
): UseSetsState & UseSetsActions => {
  const { autoLoad = true } = options;
  const [sets, setSets] = useState<SetEntry[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dbService.getAllSets();
      setSets(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load sets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoLoad) return;
    refresh();
  }, [autoLoad, refresh]);

  useDbChange(
    useCallback(
      (detail) => {
        if (!autoLoad) return;
        if (!SET_SOURCES.has(detail.source)) return;
        refresh();
      },
      [autoLoad, refresh],
    ),
  );

  return {
    sets,
    loading,
    error,
    refresh,
    addSet: (entry) => dbService.addSet(entry),
    updateSet: (entry) => dbService.updateSet(entry),
    deleteSet: (id) => dbService.deleteSet(id),
    querySetsByDate: (date) => dbService.querySetsByDate(date),
    querySetsByExercise: (exerciseId) => dbService.querySetsByExercise(exerciseId),
    setSets,
  };
};
