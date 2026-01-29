/**
 * Catalog store - manages programs and exercises.
 * Modular structure for better maintainability.
 */

import { createStore } from "zustand/vanilla";
import type { Exercise, InputMode, Program } from "../../types/gym";
import { createId } from "../../app/shared/lib/utils";
import { seedExercises, seedPrograms } from "../../app/shared/lib/seed";
import type { StorageAdapter } from "../../storage/adapter";
import { indexedDbStorage } from "../../storage/adapter";

export const CATALOG_SCHEMA_VERSION = 1;

const migrateCatalog = (
  programs: Program[],
  exercises: Exercise[],
  fromVersion: number
): { programs: Program[]; exercises: Exercise[] } => {
  if (fromVersion === CATALOG_SCHEMA_VERSION) return { programs, exercises };
  // Future migrations go here
  return { programs, exercises };
};

export type CatalogState = {
  schemaVersion: number;
  hasHydrated: boolean;
  lastHydratedAt?: number;
  programs: Program[];
  exercises: Exercise[];
  hydrate: () => Promise<void>;
  createProgram: () => string;
  updateProgram: (id: string, patch: Partial<Program>) => void;
  deleteProgram: (id: string) => void;
  reorderProgramExercise: (programId: string, fromId: string, toId: string) => void;
  moveProgramExercise: (programId: string, exerciseId: string, direction: "up" | "down") => void;
  addExerciseToProgram: (programId: string, exerciseId: string) => void;
  removeExerciseFromProgram: (programId: string, exerciseId: string) => void;
  createExercise: (name: string, type: Exercise["type"], mode: InputMode) => string;
  replaceCatalog: (programs: Program[], exercises: Exercise[]) => void;
};

export const createCatalogStore = (storage: StorageAdapter = indexedDbStorage) =>
  createStore<CatalogState>((set, get) => ({
    schemaVersion: CATALOG_SCHEMA_VERSION,
    hasHydrated: false,
    programs: [],
    exercises: [],
    lastHydratedAt: undefined,

    hydrate: async () => {
      if (get().hasHydrated) return;
      const [programs, exercises, meta] = await Promise.all([
        storage.getPrograms(),
        storage.getExercises(),
        storage.getMeta("catalog"),
      ]);
      const storedVersion = meta?.value.schemaVersion ?? 0;
      const migrated = migrateCatalog(programs, exercises, storedVersion);

      // Seed if empty
      if (migrated.programs.length === 0 || migrated.exercises.length === 0) {
        const seededExercises = seedExercises();
        const seededPrograms = seedPrograms(seededExercises.map((ex) => ex.id));
        set(
          {
            programs: seededPrograms,
            exercises: seededExercises,
            hasHydrated: true,
            lastHydratedAt: Date.now(),
          },
          false
        );
        return;
      }

      set(
        {
          programs: migrated.programs,
          exercises: migrated.exercises,
          hasHydrated: true,
          lastHydratedAt: Date.now(),
        },
        false
      );
    },

    // Program actions
    createProgram: () => {
      const id = createId();
      const program: Program = { id, name: "New Program", note: "", exerciseIds: [] };
      set((state) => ({ programs: [...state.programs, program] }), false);
      return id;
    },

    updateProgram: (id, patch) => {
      set(
        (state) => {
          const programs = state.programs.map((program) =>
            program.id === id ? { ...program, ...patch } : program
          );
          return { programs };
        },
        false
      );
    },

    deleteProgram: (id) => {
      set(
        (state) => ({
          programs: state.programs.filter((program) => program.id !== id),
        }),
        false
      );
    },

    reorderProgramExercise: (programId, fromId, toId) => {
      set(
        (state) => {
          const programs = state.programs.map((program) => {
            if (program.id !== programId) return program;
            const fromIndex = program.exerciseIds.indexOf(fromId);
            const toIndex = program.exerciseIds.indexOf(toId);
            if (fromIndex === -1 || toIndex === -1) return program;
            const exerciseIds = [...program.exerciseIds];
            exerciseIds.splice(fromIndex, 1);
            exerciseIds.splice(toIndex, 0, fromId);
            return { ...program, exerciseIds };
          });
          return { programs };
        },
        false
      );
    },

    moveProgramExercise: (programId, exerciseId, direction) => {
      set(
        (state) => {
          const programs = state.programs.map((program) => {
            if (program.id !== programId) return program;
            const index = program.exerciseIds.indexOf(exerciseId);
            if (index === -1) return program;
            const targetIndex = direction === "up" ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= program.exerciseIds.length) return program;
            const exerciseIds = [...program.exerciseIds];
            [exerciseIds[index], exerciseIds[targetIndex]] = [
              exerciseIds[targetIndex],
              exerciseIds[index],
            ];
            return { ...program, exerciseIds };
          });
          return { programs };
        },
        false
      );
    },

    addExerciseToProgram: (programId, exerciseId) => {
      set(
        (state) => {
          const programs = state.programs.map((program) => {
            if (program.id !== programId) return program;
            if (program.exerciseIds.includes(exerciseId)) return program;
            return { ...program, exerciseIds: [...program.exerciseIds, exerciseId] };
          });
          return { programs };
        },
        false
      );
    },

    removeExerciseFromProgram: (programId, exerciseId) => {
      set(
        (state) => {
          const programs = state.programs.map((program) => {
            if (program.id !== programId) return program;
            return {
              ...program,
              exerciseIds: program.exerciseIds.filter((id) => id !== exerciseId),
            };
          });
          return { programs };
        },
        false
      );
    },

    // Exercise actions
    createExercise: (name, type, mode) => {
      const id = createId();
      const exercise: Exercise = { id, name, type, defaultInputMode: mode };
      set((state) => ({ exercises: [...state.exercises, exercise] }), false);
      return id;
    },

    replaceCatalog: (programs, exercises) => {
      set({ programs, exercises }, false);
    },
  }));
