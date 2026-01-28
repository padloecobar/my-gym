import { createStore } from "zustand/vanilla";
import type { Exercise, InputMode, Program } from "../types/gym";
import { createId } from "../lib/utils";
import { seedExercises, seedPrograms } from "../lib/seed";
import type { StorageAdapter } from "../storage/adapter";
import { indexedDbStorage } from "../storage/adapter";

export const CATALOG_SCHEMA_VERSION = 1;

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

const migrateCatalog = (
  programs: Program[],
  exercises: Exercise[],
  fromVersion: number
): { programs: Program[]; exercises: Exercise[] } => {
  if (fromVersion === CATALOG_SCHEMA_VERSION) return { programs, exercises };
  return { programs, exercises };
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

          if (migrated.programs.length === 0 || migrated.exercises.length === 0) {
            const seededExercises = seedExercises();
            const seededPrograms = seedPrograms(seededExercises.map((ex) => ex.id));
            set(
              {
                programs: seededPrograms,
                exercises: seededExercises,
                hasHydrated: true,
                lastHydratedAt: Date.now(),
              }, false
            );
            return;
          }
          set(
            {
              programs: migrated.programs,
              exercises: migrated.exercises,
              hasHydrated: true,
              lastHydratedAt: Date.now(),
            }, false
          );
        },
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
            }, false
          );
        },
        deleteProgram: (id) => {
          set(
            (state) => ({
              programs: state.programs.filter((program) => program.id !== id),
            }), false
          );
        },
        reorderProgramExercise: (programId, fromId, toId) => {
          set(
            (state) => {
              const programs = state.programs.map((program) => {
                if (program.id !== programId) return program;
                const fromIndex = program.exerciseIds.indexOf(fromId);
                const toIndex = program.exerciseIds.indexOf(toId);
                if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return program;
                const next = [...program.exerciseIds];
                next.splice(fromIndex, 1);
                next.splice(toIndex, 0, fromId);
                return { ...program, exerciseIds: next };
              });
              return { programs };
            }, false
          );
        },
        moveProgramExercise: (programId, exerciseId, direction) => {
          set(
            (state) => {
              const programs = state.programs.map((program) => {
                if (program.id !== programId) return program;
                const index = program.exerciseIds.indexOf(exerciseId);
                if (index === -1) return program;
                const nextIndex = direction === "up" ? index - 1 : index + 1;
                if (nextIndex < 0 || nextIndex >= program.exerciseIds.length) return program;
                const next = [...program.exerciseIds];
                next.splice(index, 1);
                next.splice(nextIndex, 0, exerciseId);
                return { ...program, exerciseIds: next };
              });
              return { programs };
            }, false
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
            }, false
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
            }, false
          );
        },
        createExercise: (name, type, mode) => {
          const defaultMode: InputMode = type === "Barbell" ? mode : "total";
          const exercise: Exercise = { id: createId(), name, type, defaultInputMode: defaultMode };
          set((state) => ({ exercises: [...state.exercises, exercise] }), false);
          return exercise.id;
        },
        replaceCatalog: (programs, exercises) => {
          set({ programs, exercises }, false);
        },
  }));
