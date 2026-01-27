"use client";

import { createContext, createElement, useContext, useState, type ReactNode } from "react";
import { useStore, type StateCreator } from "zustand";
import { createStore } from "zustand/vanilla";
import type { Exercise, GymExport, InputMode, Program, SetEntry, Settings, Workout, WorkoutEntry } from "../types/gym";
import { createId } from "../lib/utils";
import { exportJSON, getAll, getById, importJSON } from "../lib/db";
import { schedulePut, scheduleSettings } from "../lib/persist";
import { seedExercises, seedPrograms, defaultSettings } from "../lib/seed";
import { startViewTransition } from "../lib/viewTransition";

export type ConfirmPayload = {
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
};

export type EditSetPayload = {
  workoutId: string;
  exerciseId: string;
  setId: string;
};

export type SearchExercisePayload = {
  programId: string;
};

type SheetState =
  | { type: null; open: false }
  | { type: "editSet"; open: boolean; payload: EditSetPayload; sessionId: number }
  | { type: "confirm"; open: boolean; payload: ConfirmPayload; sessionId: number }
  | { type: "searchExercise"; open: boolean; payload: SearchExercisePayload; sessionId: number };

type SnackbarState = {
  open: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

type UiState = {
  sheet: SheetState;
  snackbar: SnackbarState;
  vtHero: { type: "program" | "history"; id: string } | null;
};

type GymState = {
  hydrated: boolean;
  programs: Program[];
  exercises: Exercise[];
  workouts: Workout[];
  settings: Settings;
  ui: UiState;
  init: () => Promise<void>;
  setVtHero: (hero: UiState["vtHero"]) => void;
  clearVtHero: () => void;
  openEditSet: (payload: EditSetPayload) => void;
  openConfirm: (payload: ConfirmPayload) => void;
  openSearchExercise: (payload: SearchExercisePayload) => void;
  closeSheet: () => void;
  showSnackbar: (message: string, actionLabel?: string, onAction?: () => void) => void;
  hideSnackbar: () => void;
  createProgram: () => string;
  updateProgram: (id: string, patch: Partial<Program>) => void;
  reorderProgramExercise: (programId: string, fromId: string, toId: string) => void;
  moveProgramExercise: (programId: string, exerciseId: string, direction: "up" | "down") => void;
  addExerciseToProgram: (programId: string, exerciseId: string) => void;
  removeExerciseFromProgram: (programId: string, exerciseId: string) => void;
  createExercise: (name: string, type: Exercise["type"], mode: InputMode) => string;
  startWorkout: (programId: string) => string;
  finishWorkout: (workoutId: string) => void;
  toggleSetComplete: (workoutId: string, exerciseId: string, setId: string) => void;
  updateSet: (workoutId: string, exerciseId: string, setId: string, patch: Partial<SetEntry>) => void;
  addSet: (workoutId: string, exerciseId: string) => void;
  deleteSet: (workoutId: string, exerciseId: string, setId: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  exportData: () => Promise<GymExport>;
  importData: (payload: GymExport) => Promise<void>;
  resetAll: () => Promise<void>;
};

let snackbarTimer: number | undefined;
let sheetSession = 0;

const createDefaultSet = (mode: InputMode, settings: Settings): SetEntry => {
  const weight = mode === "plates" ? settings.defaultBarWeight : 0;
  return {
    id: createId(),
    weightKg: weight,
    reps: 8,
    completed: false,
    mode,
  };
};

const getLatestCompletedWorkout = (workouts: Workout[], programId: string) => {
  return workouts
    .filter((workout) => workout.programId === programId && workout.endedAt)
    .sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))[0];
};

const cloneSuggestedSets = (entry?: WorkoutEntry): WorkoutEntry => {
  if (!entry) {
    return { exerciseId: "", sets: [], suggested: false };
  }
  return {
    exerciseId: entry.exerciseId,
    suggested: entry.sets.length > 0,
    sets: entry.sets.map((set) => ({
      ...set,
      id: createId(),
      completed: false,
    })),
  };
};

const createGymState: StateCreator<GymState> = (set, get) => ({
  hydrated: false,
  programs: [],
  exercises: [],
  workouts: [],
  settings: defaultSettings,
  ui: {
    sheet: { type: null, open: false },
    snackbar: { open: false, message: "" },
    vtHero: null,
  },
  init: async () => {
    if (get().hydrated) return;
    try {
      const [programs, exercises, workouts] = await Promise.all([
        getAll<Program>("programs"),
        getAll<Exercise>("exercises"),
        getAll<Workout>("workouts"),
      ]);
      const settingsRecord = await getById<{ id: string; value: Settings }>("settings", "settings");

      if (programs.length === 0 || exercises.length === 0) {
        const seededExercises = seedExercises();
        const seededPrograms = seedPrograms(seededExercises.map((ex) => ex.id));

        seededExercises.forEach((exercise) => schedulePut("exercises", exercise));
        seededPrograms.forEach((program) => schedulePut("programs", program));
        scheduleSettings(defaultSettings);

        set({
          programs: seededPrograms,
          exercises: seededExercises,
          workouts,
          settings: settingsRecord?.value ?? defaultSettings,
          hydrated: true,
        });
        return;
      }

      const nextSettings = settingsRecord?.value ?? defaultSettings;
      if (!settingsRecord) {
        scheduleSettings(nextSettings);
      }
      set({
        programs,
        exercises,
        workouts,
        settings: nextSettings,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },
  setVtHero: (hero) => {
    set((state) => ({ ui: { ...state.ui, vtHero: hero } }));
    if (hero) {
      if (typeof window !== "undefined") {
        window.setTimeout(() => {
          set((state) => ({ ui: { ...state.ui, vtHero: null } }));
        }, 700);
      }
    }
  },
  clearVtHero: () => set((state) => ({ ui: { ...state.ui, vtHero: null } })),
  openEditSet: (payload) => {
    startViewTransition(() => {
      sheetSession += 1;
      set((state) => ({
        ui: { ...state.ui, sheet: { type: "editSet", open: true, payload, sessionId: sheetSession } },
      }));
    });
  },
  openConfirm: (payload) => {
    startViewTransition(() => {
      sheetSession += 1;
      set((state) => ({
        ui: { ...state.ui, sheet: { type: "confirm", open: true, payload, sessionId: sheetSession } },
      }));
    });
  },
  openSearchExercise: (payload) => {
    startViewTransition(() => {
      sheetSession += 1;
      set((state) => ({
        ui: { ...state.ui, sheet: { type: "searchExercise", open: true, payload, sessionId: sheetSession } },
      }));
    });
  },
  closeSheet: () => {
    startViewTransition(() => {
      set((state) => {
        if (state.ui.sheet.type === null) {
          return state;
        }
        return { ui: { ...state.ui, sheet: { ...state.ui.sheet, open: false } } };
      });
    });
  },
  showSnackbar: (message, actionLabel, onAction) => {
    if (typeof window === "undefined") return;
    if (snackbarTimer) {
      window.clearTimeout(snackbarTimer);
    }
    set((state) => ({
      ui: {
        ...state.ui,
        snackbar: {
          open: true,
          message,
          actionLabel,
          onAction,
        },
      },
    }));
    snackbarTimer = window.setTimeout(() => {
      set((state) => ({ ui: { ...state.ui, snackbar: { ...state.ui.snackbar, open: false } } }));
    }, 4200);
  },
  hideSnackbar: () => {
    if (typeof window === "undefined") return;
    if (snackbarTimer) {
      window.clearTimeout(snackbarTimer);
    }
    set((state) => ({ ui: { ...state.ui, snackbar: { ...state.ui.snackbar, open: false } } }));
  },
  createProgram: () => {
    const id = createId();
    const program: Program = { id, name: "New Program", note: "", exerciseIds: [] };
    set((state) => ({ programs: [...state.programs, program] }));
    schedulePut("programs", program);
    return id;
  },
  updateProgram: (id, patch) => {
    set((state) => {
      const programs = state.programs.map((program) =>
        program.id === id ? { ...program, ...patch } : program
      );
      const updated = programs.find((program) => program.id === id);
      if (updated) {
        schedulePut("programs", updated);
      }
      return { programs };
    });
  },
  reorderProgramExercise: (programId, fromId, toId) => {
    set((state) => {
      const programs = state.programs.map((program) => {
        if (program.id !== programId) return program;
        const fromIndex = program.exerciseIds.indexOf(fromId);
        const toIndex = program.exerciseIds.indexOf(toId);
        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return program;
        const next = [...program.exerciseIds];
        next.splice(fromIndex, 1);
        next.splice(toIndex, 0, fromId);
        const updated = { ...program, exerciseIds: next };
        schedulePut("programs", updated);
        return updated;
      });
      return { programs };
    });
  },
  moveProgramExercise: (programId, exerciseId, direction) => {
    set((state) => {
      const programs = state.programs.map((program) => {
        if (program.id !== programId) return program;
        const index = program.exerciseIds.indexOf(exerciseId);
        if (index === -1) return program;
        const nextIndex = direction === "up" ? index - 1 : index + 1;
        if (nextIndex < 0 || nextIndex >= program.exerciseIds.length) return program;
        const next = [...program.exerciseIds];
        next.splice(index, 1);
        next.splice(nextIndex, 0, exerciseId);
        const updated = { ...program, exerciseIds: next };
        schedulePut("programs", updated);
        return updated;
      });
      return { programs };
    });
  },
  addExerciseToProgram: (programId, exerciseId) => {
    set((state) => {
      const programs = state.programs.map((program) => {
        if (program.id !== programId) return program;
        if (program.exerciseIds.includes(exerciseId)) return program;
        const updated = { ...program, exerciseIds: [...program.exerciseIds, exerciseId] };
        schedulePut("programs", updated);
        return updated;
      });
      return { programs };
    });
  },
  removeExerciseFromProgram: (programId, exerciseId) => {
    set((state) => {
      const programs = state.programs.map((program) => {
        if (program.id !== programId) return program;
        const updated = {
          ...program,
          exerciseIds: program.exerciseIds.filter((id) => id !== exerciseId),
        };
        schedulePut("programs", updated);
        return updated;
      });
      return { programs };
    });
  },
  createExercise: (name, type, mode) => {
    const exercise: Exercise = { id: createId(), name, type, defaultInputMode: mode };
    set((state) => ({ exercises: [...state.exercises, exercise] }));
    schedulePut("exercises", exercise);
    return exercise.id;
  },
  startWorkout: (programId) => {
    const state = get();
    const program = state.programs.find((item) => item.id === programId);
    if (!program) return "";

    const lastWorkout = getLatestCompletedWorkout(state.workouts, programId);
    const entries: WorkoutEntry[] = program.exerciseIds.map((exerciseId) => {
      const previousEntry = lastWorkout?.entries.find((entry) => entry.exerciseId === exerciseId);
      if (previousEntry) {
        const cloned = cloneSuggestedSets(previousEntry);
        return { ...cloned, exerciseId };
      }
      const exercise = state.exercises.find((item) => item.id === exerciseId);
      const mode = exercise?.defaultInputMode ?? "total";
      return {
        exerciseId,
        suggested: false,
        sets: [createDefaultSet(mode, state.settings)],
      };
    });

    const workout: Workout = {
      id: createId(),
      programId,
      startedAt: Date.now(),
      entries,
    };

    set((current) => ({ workouts: [...current.workouts, workout] }));
    schedulePut("workouts", workout);
    return workout.id;
  },
  finishWorkout: (workoutId) => {
    set((state) => {
      const workouts = state.workouts.map((workout) => {
        if (workout.id !== workoutId) return workout;
        const updated = { ...workout, endedAt: Date.now() };
        schedulePut("workouts", updated);
        return updated;
      });
      return { workouts };
    });
  },
  toggleSetComplete: (workoutId, exerciseId, setId) => {
    set((state) => {
      const workouts = state.workouts.map((workout) => {
        if (workout.id !== workoutId) return workout;
        const entries = workout.entries.map((entry) => {
          if (entry.exerciseId !== exerciseId) return entry;
          const sets = entry.sets.map((set) =>
            set.id === setId ? { ...set, completed: !set.completed } : set
          );
          return { ...entry, sets };
        });
        const updated = { ...workout, entries };
        schedulePut("workouts", updated);
        return updated;
      });
      return { workouts };
    });
  },
  updateSet: (workoutId, exerciseId, setId, patch) => {
    set((state) => {
      const workouts = state.workouts.map((workout) => {
        if (workout.id !== workoutId) return workout;
        const entries = workout.entries.map((entry) => {
          if (entry.exerciseId !== exerciseId) return entry;
          const sets = entry.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set));
          return { ...entry, sets };
        });
        const updated = { ...workout, entries };
        schedulePut("workouts", updated);
        return updated;
      });
      return { workouts };
    });
  },
  addSet: (workoutId, exerciseId) => {
    set((state) => {
      const workouts = state.workouts.map((workout) => {
        if (workout.id !== workoutId) return workout;
        const entries = workout.entries.map((entry) => {
          if (entry.exerciseId !== exerciseId) return entry;
          const last = entry.sets[entry.sets.length - 1];
          const nextSet: SetEntry = last
            ? { ...last, id: createId(), completed: false }
            : createDefaultSet("total", state.settings);
          return { ...entry, sets: [...entry.sets, nextSet] };
        });
        const updated = { ...workout, entries };
        schedulePut("workouts", updated);
        return updated;
      });
      return { workouts };
    });
  },
  deleteSet: (workoutId, exerciseId, setId) => {
    const state = get();
    const workout = state.workouts.find((item) => item.id === workoutId);
    const entry = workout?.entries.find((item) => item.exerciseId === exerciseId);
    const setIndex = entry?.sets.findIndex((item) => item.id === setId) ?? -1;
    const removed = entry?.sets.find((item) => item.id === setId);

    if (!workout || !entry || !removed) return;

    set((current) => {
      const workouts = current.workouts.map((item) => {
        if (item.id !== workoutId) return item;
        const entries = item.entries.map((entryItem) => {
          if (entryItem.exerciseId !== exerciseId) return entryItem;
          return { ...entryItem, sets: entryItem.sets.filter((set) => set.id !== setId) };
        });
        const updated = { ...item, entries };
        schedulePut("workouts", updated);
        return updated;
      });
      return { workouts };
    });

    get().showSnackbar("Set deleted", "Undo", () => {
      set((current) => {
        const workouts = current.workouts.map((item) => {
          if (item.id !== workoutId) return item;
          const entries = item.entries.map((entryItem) => {
            if (entryItem.exerciseId !== exerciseId) return entryItem;
            const nextSets = [...entryItem.sets];
            nextSets.splice(setIndex, 0, removed);
            return { ...entryItem, sets: nextSets };
          });
          const updated = { ...item, entries };
          schedulePut("workouts", updated);
          return updated;
        });
        return { workouts };
      });
    });
  },
  updateSettings: (patch) => {
    set((state) => {
      const updated = { ...state.settings, ...patch };
      scheduleSettings(updated);
      return { settings: updated };
    });
  },
  exportData: async () => exportJSON(),
  importData: async (payload) => {
    await importJSON(payload);
    set({
      programs: payload.programs,
      exercises: payload.exercises,
      workouts: payload.workouts,
      settings: payload.settings,
    });
  },
  resetAll: async () => {
    const seededExercises = seedExercises();
    const seededPrograms = seedPrograms(seededExercises.map((ex) => ex.id));

    await importJSON({
      exercises: seededExercises,
      programs: seededPrograms,
      workouts: [],
      settings: defaultSettings,
    });

    set({
      programs: seededPrograms,
      exercises: seededExercises,
      workouts: [],
      settings: defaultSettings,
    });
  },
});

export const createGymStore = () => createStore<GymState>()(createGymState);

type GymStore = ReturnType<typeof createGymStore>;

const GymStoreContext = createContext<GymStore | null>(null);

export function GymStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createGymStore());
  return createElement(GymStoreContext.Provider, { value: store }, children);
}

export const useGymStore = <T,>(selector: (state: GymState) => T): T => {
  const store = useContext(GymStoreContext);
  if (!store) throw new Error("GymStoreProvider missing");
  return useStore(store, selector);
};

export const useActiveWorkout = () => {
  return useGymStore((state) => {
    const active = state.workouts.filter((workout) => !workout.endedAt);
    if (active.length === 0) return null;
    return active.sort((a, b) => b.startedAt - a.startedAt)[0];
  });
};
